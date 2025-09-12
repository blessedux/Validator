# Profile Endpoints - Documentation

Profile endpoints manage user public information (profile picture, contact data, etc).

## Get Profile

### DESCRIPTION
Retrieves user profile information searching by his wallet address.

### ENDPOINT
`/api/profile`

### METHOD

`GET`

### (JSON) PARAMETERS

| Parameter     | Type    | Requerided          | Description                                 |
| ------------- | ------- | ------------------- | ------------------------------------------- |
| `wallet address encoded`| string | yes        | User wallet address encoded as authHeader, sended automatically from cache  |


### POSIBLE RESULTS

```json
(WIP)
```

## Create Profile

### DESCRIPTION
Create new profile to a wallet address (user) or update it if exists.

### ENDPOINT
`/api/profile`

### METHOD

`POST`

### (JSON) PARAMETERS

| Parameter     | Type    | Requerided          | Description                                 |
| ------------- | ------- | ------------------- | ------------------------------------------- |
| `walletAddress encoded`| string | yes        | User wallet address encoded as authHeader, sended automatically from cache  |
| `username`| string | no        | Name of the user |
| `company`| string | no        | Affiliated organization |
| `email`| string | no        | Contact email |
| `profileImage`| file | no        | User profile image |


### POSIBLE RESULTS

```json
(WIP)
```

## Upload Profile Image

### DESCRIPTION
Endpoint to upload profile image. File must be an image and less than 5MB.

### ENDPOINT
`/api/profile/upload-image`

### METHOD

`POST`

### (JSON) PARAMETERS

| Parameter     | Type    | Requerided          | Description                                 |
| ------------- | ------- | ------------------- | ------------------------------------------- |
| `walletAddress encoded`| string | yes        | User wallet address encoded as authHeader, sended automatically from cache  |
| `profileImage`| file/string | yes        | User profile image |


### POSIBLE RESULTS

```json
(WIP)
```
