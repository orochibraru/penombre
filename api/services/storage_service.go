package services

import (
	"context"
	"errors"
	"fmt"
	"log"
	db "opendrive/api/db/sqlc"
	"os"
	"path/filepath"
	"sort"
	"strings"
	"sync"
	"time"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/credentials"
	"github.com/aws/aws-sdk-go-v2/service/s3"
	"github.com/aws/aws-sdk-go-v2/service/s3/types"
	"github.com/aws/smithy-go"
)

// StorageService encapsulates S3-related operations.
type StorageService struct {
	S3Client      *s3.Client
	PresignClient *s3.PresignClient
}

var codeFileExtensions = map[string]bool{
	".html": true, ".htm": true, ".css": true, ".scss": true, ".sass": true, ".less": true,
	".js": true, ".mjs": true, ".cjs": true, ".ts": true, ".tsx": true, ".jsx": true,
	".vue": true, ".svelte": true, ".php": true, ".py": true, ".rb": true, ".java": true,
	".go": true, ".rs": true, ".c": true, ".cpp": true, ".cs": true, ".swift": true, ".kt": true,
	".json": true, ".jsonc": true, ".xml": true, ".yaml": true, ".yml": true, ".toml": true,
	".ini": true, ".env": true, ".md": true, ".sql": true, ".sh": true, ".hcl": true, ".tf": true,
}

var codeFileNames = map[string]bool{
	"dockerfile": true, "taskfile": true, "makefile": true, "caddyfile": true,
}

// isCodeItem checks if a filename corresponds to a known code file type.
func isCodeItem(fileName string) bool {
	ext := filepath.Ext(fileName)
	if codeFileExtensions[ext] {
		return true
	}
	// Check for files without extensions like 'Dockerfile'
	if codeFileNames[strings.ToLower(fileName)] {
		return true
	}
	return false
}

func DetermineFileCategory(fileName, contentType string) string {
	if isCodeItem(fileName) {
		return "code"
	}
	if strings.HasPrefix(contentType, "image/") {
		return "images"
	}
	if strings.HasPrefix(contentType, "audio/") {
		return "music"
	}
	if contentType == "application/pdf" {
		return "documents"
	}
	return "" // Default category if none match
}

// NewStorageService initializes and returns a new StorageService.
func NewStorageService() (*StorageService, error) {
	minioUrl := "http://localhost:9000"
	minioUrlEnv := os.Getenv("MINIO_URL")
	if minioUrlEnv != "" {
		minioUrl = minioUrlEnv
	}
	cfg, err := config.LoadDefaultConfig(context.TODO(),
		config.WithRegion("us-east-1"),
		config.WithCredentialsProvider(credentials.NewStaticCredentialsProvider("opendrive", "opendrive", "")),
		config.WithBaseEndpoint(minioUrl),
	)
	if err != nil {
		log.Fatalf("unable to load SDK config, %v", err)
		return nil, err
	}

	s3Client := s3.NewFromConfig(cfg, func(o *s3.Options) {
		o.UsePathStyle = true
	})

	presignClient := s3.NewPresignClient(s3Client)

	return &StorageService{
		S3Client:      s3Client,
		PresignClient: presignClient,
	}, nil
}

// ListBuckets retrieves all buckets from the S3-compatible storage.
func (s *StorageService) ListBuckets() ([]Bucket, error) {
	result, err := s.S3Client.ListBuckets(context.TODO(), &s3.ListBucketsInput{})
	if err != nil {
		return nil, err
	}

	var buckets []Bucket
	for _, b := range result.Buckets {
		buckets = append(buckets, Bucket{
			Name:         aws.ToString(b.Name),
			CreationDate: aws.ToTime(b.CreationDate),
		})
	}

	return buckets, nil
}

func (s *StorageService) BucketExists(bucketName string) (bool, error) {
	_, err := s.S3Client.HeadBucket(context.TODO(), &s3.HeadBucketInput{
		Bucket: aws.String(bucketName),
	})

	if err != nil {
		var apiErr smithy.APIError
		if errors.As(err, &apiErr) {
			switch apiErr.ErrorCode() {
			case "NotFound": // In AWS S3 this is "404 Not Found", MinIO might use "NotFound"
				return false, nil
			}
		}
		// Handle other errors (e.g., network issues, permissions)
		return false, err
	}
	// If HeadBucket returns no error, the bucket exists
	return true, nil
}

func (s *StorageService) EnsureUserBucket(user db.User) error {
	bucketName := user.ID.String()
	exists, err := s.BucketExists(bucketName)
	if err != nil {
		return fmt.Errorf("failed to check if bucket '%s' exists: %w", bucketName, err)
	}

	if !exists {
		log.Printf("Bucket '%s' does not exist. Creating now...", bucketName)
		err := s.CreateBucket(bucketName)
		if err != nil {
			return fmt.Errorf("failed to create bucket '%s': %w", bucketName, err)
		}
		log.Printf("Successfully created bucket '%s'", bucketName)
	}

	return nil
}

func (s *StorageService) CreateBucket(bucketName string) error {
	_, err := s.S3Client.CreateBucket(context.TODO(), &s3.CreateBucketInput{
		Bucket: aws.String(bucketName),
	})
	return err
}

// ListObjects retrieves objects and common prefixes (folders) from the S3-compatible storage, including metadata.
func (s *StorageService) ListObjects(bucket, folderPath string) (*ObjectList, error) {
	var objects []ObjectItem
	var continuationToken *string

	prefix := ""
	if folderPath != "" {
		prefix = folderPath + "/"
	}

	for {
		input := &s3.ListObjectsV2Input{
			Bucket:            aws.String(bucket),
			ContinuationToken: continuationToken,
			Delimiter:         aws.String("/"),
			Prefix:            aws.String(prefix),
		}

		result, err := s.S3Client.ListObjectsV2(context.TODO(), input)
		if err != nil {
			return nil, err
		}

		for _, cp := range result.CommonPrefixes {
			objects = append(objects, ObjectItem{
				Key: aws.ToString(cp.Prefix),
			})
		}

		for _, obj := range result.Contents {
			if obj.Key != nil && *obj.Key == prefix {
				continue
			}
			objects = append(objects, ObjectItem{
				Key:          aws.ToString(obj.Key),
				LastModified: obj.LastModified,
				ETag:         obj.ETag,
				Size:         func(i int64) *int { j := int(i); return &j }(*obj.Size),
				StorageClass: (*string)(&obj.StorageClass),
			})
		}

		if result.NextContinuationToken == nil {
			break
		}
		continuationToken = result.NextContinuationToken
	}

	var wg sync.WaitGroup
	for i, obj := range objects {
		if strings.HasSuffix(obj.Key, "/") {
			continue
		}
		wg.Add(1)
		go func(i int, key string) {
			defer wg.Done()
			head, err := s.S3Client.HeadObject(context.TODO(), &s3.HeadObjectInput{
				Bucket: aws.String(bucket),
				Key:    aws.String(key),
			})
			if err != nil {
				log.Printf("Failed to get metadata for %s: %v", key, err)
				return
			}
			objects[i].ContentType = head.ContentType
			objects[i].Metadata = &head.Metadata
		}(i, obj.Key)
	}
	wg.Wait()

	for i := range objects {
		if prefix != "" {
			key := strings.TrimPrefix(objects[i].Key, prefix)
			objects[i].Key = key
		}
	}

	return &ObjectList{
		// The Count field in ObjectList is a pointer to an int, so we need to take its address.
		Count: len(objects),
		List:  objects,
	}, nil
}

func (s *StorageService) GetObject(bucket, key string) (*ObjectItem, error) {
	head, err := s.S3Client.HeadObject(context.TODO(), &s3.HeadObjectInput{
		Bucket: aws.String(bucket),
		Key:    aws.String(key),
	})
	if err != nil {
		return nil, err
	}

	object := &ObjectItem{
		Key:          key, // Use the provided key as HeadObject doesn't return it
		LastModified: head.LastModified,
		ETag:         head.ETag,
		Size:         func(i int64) *int { j := int(i); return &j }(*head.ContentLength),
		ContentType:  head.ContentType,
		Metadata:     &head.Metadata,
	}

	return object, nil
}

func (s *StorageService) ListRecentObjects(bucket string) (*ObjectList, error) {
	var objects []ObjectItem
	paginator := s3.NewListObjectsV2Paginator(s.S3Client, &s3.ListObjectsV2Input{
		Bucket: aws.String(bucket),
	})

	for paginator.HasMorePages() {
		page, err := paginator.NextPage(context.TODO())
		if err != nil {
			return nil, err
		}
		for _, obj := range page.Contents {
			// Exclude folders
			if !strings.HasSuffix(*obj.Key, "/") {
				objects = append(objects, ObjectItem{
					Key:          aws.ToString(obj.Key),
					LastModified: obj.LastModified,
					ETag:         obj.ETag,
					Size:         func(i int64) *int { j := int(i); return &j }(*obj.Size),
					StorageClass: (*string)(&obj.StorageClass),
				})
			}
		}
	}

	// Sort objects by LastModified date, descending
	sort.Slice(objects, func(i, j int) bool {
		if objects[i].LastModified == nil || objects[j].LastModified == nil {
			return false // Handle nil pointers if they occur
		}
		return objects[i].LastModified.After(*objects[j].LastModified)
	})

	var wg sync.WaitGroup
	for i, obj := range objects {
		if strings.HasSuffix(obj.Key, "/") {
			continue
		}
		wg.Add(1)
		go func(i int, key string) {
			defer wg.Done()
			head, err := s.S3Client.HeadObject(context.TODO(), &s3.HeadObjectInput{
				Bucket: aws.String(bucket),
				Key:    aws.String(key),
			})
			if err != nil {
				log.Printf("Failed to get metadata for %s: %v", key, err)
				return
			}
			objects[i].ContentType = head.ContentType
			objects[i].Metadata = &head.Metadata
		}(i, obj.Key)
	}
	wg.Wait()

	return &ObjectList{
		Count: len(objects),
		List:  objects,
	}, nil
}

func (s *StorageService) ListObjectsByCategory(bucket, category string) (*ObjectList, error) {
	var filteredObjects []ObjectItem
	paginator := s3.NewListObjectsV2Paginator(s.S3Client, &s3.ListObjectsV2Input{
		Bucket: aws.String(bucket),
	})

	for paginator.HasMorePages() {
		page, err := paginator.NextPage(context.TODO())
		if err != nil {
			return nil, err
		}
		for _, obj := range page.Contents {
			// Exclude folders
			if !strings.HasSuffix(*obj.Key, "/") {
				// We need to fetch metadata to check the category
				head, err := s.S3Client.HeadObject(context.TODO(), &s3.HeadObjectInput{
					Bucket: aws.String(bucket),
					Key:    obj.Key,
				})
				if err != nil {
					log.Printf("Failed to get metadata for %s: %v", *obj.Key, err)
					continue
				}

				if objectCategory, ok := head.Metadata["category"]; ok && strings.EqualFold(objectCategory, category) {
					filteredObjects = append(filteredObjects, ObjectItem{
						Key:          aws.ToString(obj.Key),
						LastModified: obj.LastModified,
						ETag:         obj.ETag,
						Size:         func(i int64) *int { j := int(i); return &j }(*obj.Size),
						StorageClass: (*string)(&obj.StorageClass),
						ContentType:  head.ContentType,
						Metadata:     &head.Metadata,
					})
				}
			}
		}
	}

	return &ObjectList{
		Count: len(filteredObjects),
		List:  filteredObjects,
	}, nil
}

// GetPresignedURL generates a temporary URL to access an S3 object.
func (s *StorageService) GetPresignedURL(bucket, key string) (string, error) {
	presignedUrl, err := s.PresignClient.PresignGetObject(context.TODO(), &s3.GetObjectInput{
		Bucket: aws.String(bucket),
		Key:    aws.String(key),
	}, func(opts *s3.PresignOptions) {
		opts.Expires = time.Duration(15 * time.Minute)
	})
	if err != nil {
		return "", err
	}

	return presignedUrl.URL, nil
}

func (s *StorageService) UploadObjectMeta(bucket string, props UploadBody) (*UploadResult, error) {
	finalName, err := s.incrementFileName(bucket, props.Key)

	if err != nil {
		return nil, err
	}

	category := DetermineFileCategory(finalName, props.Type)

	var metadata = *props.Metadata
	metadata["category"] = category

	var objectMeta = &s3.PutObjectInput{
		Bucket:      &bucket,
		Key:         &finalName,
		ContentType: &props.Type,
		Metadata:    metadata,
	}
	_, err = s.S3Client.PutObject(context.TODO(), objectMeta)

	if err != nil {
		log.Fatal("Failed to upload object meta")
	}

	presignedUrl, err := s.PresignClient.PresignPutObject(context.TODO(), objectMeta, func(opts *s3.PresignOptions) {
		opts.Expires = time.Duration(15 * time.Minute)
	})

	if err != nil {
		return nil, err
	}

	var res = &UploadResult{
		PresignedUrl: presignedUrl.URL,
		FinalName:    finalName,
		Metadata:     &metadata,
	}

	return res, nil
}

func (s *StorageService) DeleteObject(bucket, key string) error {
	_, err := s.S3Client.DeleteObject(context.TODO(), &s3.DeleteObjectInput{
		Bucket: aws.String(bucket),
		Key:    aws.String(key),
	})
	return err
}

func (s *StorageService) fileExists(bucket, fileName string) (bool, error) {
	resp, err := s.S3Client.ListObjectsV2(context.TODO(), &s3.ListObjectsV2Input{
		Bucket:  aws.String(bucket),
		Prefix:  aws.String(fileName),
		MaxKeys: aws.Int32(1),
	})
	if err != nil {
		return false, err
	}
	return resp.KeyCount != nil && *resp.KeyCount > 0, nil
}

func (s *StorageService) folderExists(bucket, folderName string) (bool, error) {
	resp, err := s.S3Client.ListObjectsV2(context.TODO(), &s3.ListObjectsV2Input{
		Bucket:  aws.String(bucket),
		Prefix:  aws.String(folderName + "/"),
		MaxKeys: aws.Int32(1),
	})
	if err != nil {
		return false, err
	}
	return resp.KeyCount != nil && *resp.KeyCount > 0, nil
}

func (s *StorageService) incrementFileName(bucket, originalName string) (string, error) {
	exists, err := s.fileExists(bucket, originalName)
	if err != nil {
		return "", err
	}
	if !exists {
		return originalName, nil
	}

	counter := 1
	for {
		newName := fmt.Sprintf("%s (%d)", originalName, counter)
		exists, err := s.fileExists(bucket, newName)
		if err != nil {
			return "", err
		}
		if !exists {
			return newName, nil
		}
		counter++
	}
}

func (s *StorageService) incrementFolderName(bucket, originalName string) (string, error) {
	exists, err := s.folderExists(bucket, originalName)
	if err != nil {
		return "", err
	}
	if !exists {
		return originalName, nil
	}

	counter := 1
	for {
		newName := fmt.Sprintf("%s (%d)", originalName, counter)
		exists, err := s.folderExists(bucket, newName)
		if err != nil {
			return "", err
		}
		if !exists {
			return newName, nil
		}
		counter++
	}
}

// CreateFolder creates a new folder in an S3 bucket.
func (s *StorageService) CreateFolder(bucket, folderName string) error {
	finalName, err := s.incrementFolderName(bucket, folderName)
	if err != nil {
		return err
	}

	_, err = s.S3Client.PutObject(context.TODO(), &s3.PutObjectInput{
		Bucket: aws.String(bucket),
		Key:    aws.String(finalName + "/"),
	})
	return err
}

// DeleteFolder deletes a folder and all of its contents.
func (s *StorageService) DeleteFolder(bucket, folderPath string) error {
	var objectsToDelete []types.ObjectIdentifier

	// List all objects in the folder
	paginator := s3.NewListObjectsV2Paginator(s.S3Client, &s3.ListObjectsV2Input{
		Bucket: aws.String(bucket),
		Prefix: aws.String(folderPath + "/"),
	})

	for paginator.HasMorePages() {
		page, err := paginator.NextPage(context.TODO())
		if err != nil {
			return err
		}
		for _, obj := range page.Contents {
			objectsToDelete = append(objectsToDelete, types.ObjectIdentifier{Key: obj.Key})
		}
	}

	// If there are objects to delete, delete them
	if len(objectsToDelete) > 0 {
		_, err := s.S3Client.DeleteObjects(context.TODO(), &s3.DeleteObjectsInput{
			Bucket: aws.String(bucket),
			Delete: &types.Delete{Objects: objectsToDelete},
		})
		if err != nil {
			return err
		}
	}

	return nil
}
