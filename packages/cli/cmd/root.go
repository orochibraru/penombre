package cmd

import (
	"os"

	"github.com/spf13/cobra"
)



// rootCmd represents the base command when called without any subcommands
var rootCmd = &cobra.Command{
	Use:   "api",
	Short: "OpenDrive API server - A modern, self-hosted cloud storage solution",
	Long: `OpenDrive API Server

A comprehensive RESTful API backend for OpenDrive, providing secure file storage,
user authentication, and OAuth integration. Built with Go and designed for both 
individual users and organizations who want complete control over their data.

Features:
  • RESTful API with OpenAPI specification
  • OAuth authentication with multiple providers
  • S3-compatible object storage integration
  • PostgreSQL database for metadata
  • File management and organization
  • Smart file categorization

For more information, visit: https://github.com/opendrive/opendrive`,
	// Uncomment the following line if your bare application
	// has an action associated with it:
	// Run: func(cmd *cobra.Command, args []string) { },
}

// Execute adds all child commands to the root command and sets flags appropriately.
// This is called by main.main(). It only needs to happen once to the rootCmd.
func Execute() {
	err := rootCmd.Execute()
	if err != nil {
		os.Exit(1)
	}
}

func init() {
	// Here you will define your flags and configuration settings.
	// Cobra supports persistent flags, which, if defined here,
	// will be global for your application.

	// Example: rootCmd.PersistentFlags().StringVar(&cfgFile, "config", "", "config file (default is $HOME/.opendrive.yaml)")
}


