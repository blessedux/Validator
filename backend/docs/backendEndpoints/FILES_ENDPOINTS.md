# Files Endpoints - Documentation

Dob validator needs to manage files to store devices documentation.


## Upload files

### DESCRIPTION
Receives any file type but only images with JPEG and PNG format then compress it to WebP. All files are stored in a secure location and file names are encrypted and loaded to db.

### ENDPOINT
`/api/files/upload`

### METHOD

`POST`

### (JSON) PARAMETERS

NONE

### POSIBLE RESULTS

```json
(WIP)
```

## Search File

### DESCRIPTION
All files are stored in a secure location and each one of them has a encrypted name, this endpoint search by those names into secure storage, returning the file.

### ENDPOINT
`/api/files/:id`

### METHOD

`GET`

### (JSON) PARAMETERS

| Parameter        | Type   | Requerided | Description                    |
| ---------------- | ------ | ---------- | ------------------------------ |
| `id`             | string | yes        | Generated at file upload       |

### POSIBLE RESULTS

```json
(WIP)
```
