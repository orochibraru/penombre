package main

import (
	"net/http"

	"github.com/labstack/echo/v4"
	"github.com/pangpanglabs/echoswagger/v2"
)

type File struct {
	ID   int    `json:"id"`
	Name string `json:"name"`
}

func listFiles(c echo.Context) error {
	return c.JSON(http.StatusOK, File{
		ID:   1,
		Name: "Test file",
	})
}

func main() {
	r := echoswagger.New(echo.New(), "/doc", nil)
	r.GET("/", listFiles)
	r.Echo().Logger.Fatal(r.Echo().Start(":8080"))
}
