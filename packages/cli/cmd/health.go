package cmd

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"time"

	"github.com/spf13/cobra"
)

var (
	healthURL string
	timeout   int
)

// healthCmd represents the health command
var healthCmd = &cobra.Command{
	Use:   "health",
	Short: "Check the health of the API server",
	Long: `Performs a health check by making an HTTP GET request to the /api/v1/healthz endpoint.
	
This command checks if the API server is running and if its dependencies (database, storage) are accessible.
Exit code 0 indicates healthy, non-zero indicates unhealthy or unreachable.`,
	Run: func(cmd *cobra.Command, args []string) {
		client := &http.Client{
			Timeout: time.Duration(timeout) * time.Second,
		}

		resp, err := client.Get(healthURL)
		if err != nil {
			fmt.Fprintf(os.Stderr, "❌ Health check failed: unable to reach server\n")
			fmt.Fprintf(os.Stderr, "Error: %v\n", err)
			os.Exit(1)
		}
		defer resp.Body.Close()

		body, err := io.ReadAll(resp.Body)
		if err != nil {
			fmt.Fprintf(os.Stderr, "❌ Health check failed: unable to read response\n")
			fmt.Fprintf(os.Stderr, "Error: %v\n", err)
			os.Exit(1)
		}

		if resp.StatusCode == http.StatusOK {
			var result interface{}
			if err := json.Unmarshal(body, &result); err == nil {
				fmt.Printf("✅ Health check passed (HTTP %d)\n", resp.StatusCode)
				fmt.Printf("Response: %v\n", result)
			} else {
				fmt.Printf("✅ Health check passed (HTTP %d)\n", resp.StatusCode)
				fmt.Printf("Response: %s\n", string(body))
			}
			os.Exit(0)
		} else {
			fmt.Fprintf(os.Stderr, "❌ Health check failed (HTTP %d)\n", resp.StatusCode)
			fmt.Fprintf(os.Stderr, "Response: %s\n", string(body))
			os.Exit(1)
		}
	},
}

func init() {
	rootCmd.AddCommand(healthCmd)

	// Define flags for the health command
	healthCmd.Flags().StringVarP(&healthURL, "url", "u", "http://localhost:8080/api/v1/healthz", "URL of the health check endpoint")
	healthCmd.Flags().IntVarP(&timeout, "timeout", "t", 10, "Timeout in seconds for the health check request")
}
