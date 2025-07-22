package handlers

import (
	"encoding/json"
	"errors"
	"io"
	"log"
	"net/http"
	"net/url"
	db "opendrive/api/db/sqlc"
	"opendrive/api/services"
	"slices"
	"strings"
	"time"

	"github.com/aws/smithy-go"
)

var allowedFileCategories = []string{"music", "documents", "images", "recent", "code", "trash"}

// GetApiV1StorageObjectsCategories implements services.ServerInterface.
func (s Server) GetApiV1StorageObjectsCategories(w http.ResponseWriter, r *http.Request) {
	RespondWithJSON(w, http.StatusOK, allowedFileCategories)
}

// GetApiV1StorageBuckets implements ServerInterface.
func (s *Server) GetApiV1StorageBuckets(w http.ResponseWriter, r *http.Request) {
	buckets, err := s.Storage.ListBuckets()
	if err != nil {
		RespondWithError(w, http.StatusInternalServerError, "Failed to list buckets")
		return
	}
	RespondWithJSON(w, http.StatusOK, buckets)
}

// PostApiV1StorageBuckets implements ServerInterface.
func (s *Server) PostApiV1StorageBuckets(w http.ResponseWriter, r *http.Request) {
	var reqBody struct {
		Name string `json:"name"`
	}

	err := json.NewDecoder(r.Body).Decode(&reqBody)

	if err != nil {
		RespondWithError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	err = s.Storage.CreateBucket(reqBody.Name)

	if err != nil {
		var apiErr smithy.APIError
		// Check if the error is an AWS API error
		if errors.As(err, &apiErr) {
			// Now you can check the specific error code
			switch apiErr.ErrorCode() {
			case "BucketAlreadyExists":
				RespondWithError(w, http.StatusConflict, "Bucket already exists")
			case "BucketAlreadyOwnedByYou":
				RespondWithError(w, http.StatusConflict, "Bucket already owned by you")
			default:
				// For other AWS errors, return a generic 500
				RespondWithError(w, http.StatusInternalServerError, "Failed to create bucket: "+apiErr.ErrorMessage())
			}
		} else {
			// For non-AWS errors (e.g., network issues)
			RespondWithError(w, http.StatusInternalServerError, "An unexpected error occurred")
		}
		RespondWithError(w, http.StatusInternalServerError, "Failed to create bucket")
		return
	}

	w.WriteHeader(http.StatusCreated)
}

func (s Server) GetBucketName(w http.ResponseWriter, r *http.Request) string {
	userContextKey := services.GetContextKey()
	session, ok := r.Context().Value(userContextKey).(db.GetSessionWithUserRow)
	if !ok {
		RespondWithError(w, http.StatusInternalServerError, "Could not retrieve user from context (getting bucket name)")
		return ""
	}

	return session.UserID.String()

}

// GetApiV1StorageObjects implements ServerInterface.
func (s *Server) GetApiV1StorageObjects(w http.ResponseWriter, r *http.Request, params services.GetApiV1StorageObjectsParams) {
	var folder string
	if params.Folder != nil {
		folder = *params.Folder
	}

	bucket := s.GetBucketName(w, r)
	objectList, err := s.Storage.ListObjects(bucket, folder)
	if err != nil {
		RespondWithError(w, http.StatusInternalServerError, "Failed to list objects")
		return
	}
	RespondWithJSON(w, http.StatusOK, objectList)
}

// DeleteApiV1StorageObjectsItem implements ServerInterface.
func (s *Server) DeleteApiV1StorageObjectsItem(w http.ResponseWriter, r *http.Request, params services.DeleteApiV1StorageObjectsItemParams) {
	bucket := s.GetBucketName(w, r)
	err := s.Storage.DeleteObject(bucket, params.Item)

	if err != nil {
		var apiErr smithy.APIError
		if errors.As(err, &apiErr) {
			RespondWithError(w, http.StatusInternalServerError, "Failed to delete object: "+apiErr.ErrorMessage())
		} else {
			RespondWithError(w, http.StatusInternalServerError, "An unexpected error occurred")
		}
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

// GetApiV1StorageObjectsCategoryCategory implements ServerInterface.
func (s *Server) GetApiV1StorageObjectsCategoryCategory(w http.ResponseWriter, r *http.Request, category string) {
	// Validate the category
	if !slices.Contains(allowedFileCategories, category) {
		RespondWithError(w, http.StatusBadRequest, "Invalid category specified")
		return
	}

	bucket := s.GetBucketName(w, r)
	objectList, err := s.Storage.ListObjectsByCategory(bucket, category)
	if err != nil {
		RespondWithError(w, http.StatusInternalServerError, "Failed to list objects by category")
		return
	}

	RespondWithJSON(w, http.StatusOK, objectList)
}

// GetApiV1StorageObjectsItem implements ServerInterface.
func (s *Server) GetApiV1StorageObjectsItem(w http.ResponseWriter, r *http.Request, params services.GetApiV1StorageObjectsItemParams) {
	bucket := s.GetBucketName(w, r)
	object, err := s.Storage.GetObject(bucket, params.Item)
	if err != nil {
		RespondWithError(w, http.StatusInternalServerError, "Failed to list recent objects")
		return
	}

	RespondWithJSON(w, http.StatusOK, object)
}

// GetApiV1StorageObjectsRecent implements ServerInterface.
func (s *Server) GetApiV1StorageObjectsRecent(w http.ResponseWriter, r *http.Request) {
	bucket := s.GetBucketName(w, r)
	objectList, err := s.Storage.ListRecentObjects(bucket)
	if err != nil {
		RespondWithError(w, http.StatusInternalServerError, "Failed to list recent objects")
		return
	}

	RespondWithJSON(w, http.StatusOK, objectList)
}

// GetApiV1StorageObjectsUrl implements ServerInterface.
func (s *Server) GetApiV1StorageObjectsUrl(w http.ResponseWriter, r *http.Request, params services.GetApiV1StorageObjectsUrlParams) {
	bucket := s.GetBucketName(w, r)
	url, err := s.Storage.GetPresignedURL(bucket, params.Item)
	if err != nil {
		RespondWithError(w, http.StatusInternalServerError, "Failed to generate presigned URL")
		return
	}
	RespondWithJSON(w, http.StatusOK, url)
}

func proxyFile(w http.ResponseWriter, r *http.Request, proxyUrl string) {
	// Get the direct presigned URL from the storage service.
	parsedURL, err := url.Parse(services.GetStorageUrl() + "/" + proxyUrl)
	if err != nil {
		http.Error(w, "Invalid target URL", http.StatusBadRequest)
		return
	}

	proxyReq, err := http.NewRequest(r.Method, parsedURL.String(), r.Body)
	if err != nil {
		http.Error(w, "Failed to create proxy request", http.StatusInternalServerError)
		return
	}

	proxyReq.ContentLength = r.ContentLength

	// Copy relevant headers
	proxyReq.Header.Set("Content-Type", r.Header.Get("Content-Type"))
	proxyReq.Header.Set("Content-Length", r.Header.Get("Content-Length"))

	// Forward other relevant headers
	for name, values := range r.Header {
		// Forward headers that are important for S3 presigned URLs
		if strings.HasPrefix(strings.ToLower(name), "x-amz-") || name == "Authorization" || name == "Content-Type" || name == "Content-Length" {
			for _, value := range values {
				proxyReq.Header.Add(name, value)
			}
		}
	}

	// Execute the request
	client := &http.Client{Timeout: 30 * time.Second}
	resp, err := client.Do(proxyReq)
	if err != nil {
		http.Error(w, "Proxy request failed", http.StatusInternalServerError)
		return
	}
	defer func() {
		err := resp.Body.Close()
		if err != nil {
			log.Print(err)
			return
		}
	}()

	// Copy response headers
	for name, values := range resp.Header {
		for _, value := range values {
			w.Header().Add(name, value)
		}
	}

	w.WriteHeader(resp.StatusCode)
	_, err = io.Copy(w, resp.Body)
	if err != nil {
		log.Print(err)
		return
	}
}

// GetP implements ServerInterface.
func (s *Server) GetP(w http.ResponseWriter, r *http.Request, params services.GetPParams) {
	proxyFile(w, r, params.Url)
}

// PutP implements ServerInterface.
func (s *Server) PutP(w http.ResponseWriter, r *http.Request, params services.PutPParams) {
	proxyFile(w, r, params.Url)
}

// PostApiV1StorageObjects implements ServerInterface.
func (s *Server) PostApiV1StorageObjects(w http.ResponseWriter, r *http.Request) {
	var reqBody services.PostApiV1StorageObjectsJSONRequestBody

	err := json.NewDecoder(r.Body).Decode(&reqBody)

	if err != nil {
		log.Printf("Invalid request body: %s", err)
		RespondWithError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	key := reqBody.Key
	if reqBody.Folder != nil && *reqBody.Folder != "" {
		key = *reqBody.Folder + "/" + key
	}

	metadata := make(map[string]string)
	if reqBody.Metadata != nil {
		metadata = *reqBody.Metadata
	}

	var obj = services.UploadBody{
		Key:      key,
		Type:     reqBody.Type,
		Metadata: &metadata,
	}

	bucket := s.GetBucketName(w, r)
	res, err := s.Storage.UploadObjectMeta(bucket, obj)
	if err != nil {
		RespondWithError(w, http.StatusInternalServerError, "Failed to generate presigned upload URL")
		return
	}

	RespondWithJSON(w, http.StatusOK, res)
}

// PostApiV1StorageObjectsFolder implements ServerInterface.
func (s *Server) PostApiV1StorageObjectsFolder(w http.ResponseWriter, r *http.Request) {
	var reqBody services.PostApiV1StorageObjectsFolderJSONRequestBody
	if err := json.NewDecoder(r.Body).Decode(&reqBody); err != nil {
		RespondWithError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	bucket := s.GetBucketName(w, r)
	err := s.Storage.CreateFolder(bucket, reqBody.Name)

	if err != nil {
		RespondWithError(w, http.StatusInternalServerError, "Failed to create folder")
		return
	}

	w.WriteHeader(http.StatusCreated)
}

// DeleteApiV1StorageObjectsFolder implements ServerInterface.
func (s *Server) DeleteApiV1StorageObjectsFolder(w http.ResponseWriter, r *http.Request, params services.DeleteApiV1StorageObjectsFolderParams) {
	bucket := s.GetBucketName(w, r)
	err := s.Storage.DeleteFolder(bucket, params.Path)

	if err != nil {
		log.Printf("%s", err.Error())
		RespondWithError(w, http.StatusInternalServerError, "Failed to delete folder")
		return
	}

	w.WriteHeader(http.StatusNoContent)
}
