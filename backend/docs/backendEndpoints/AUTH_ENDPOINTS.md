# Authentication Endpoints - Documentation

All endpoints used for user login and registration.

## Authentication Challenge

### DESCRIPTION
Use wallet address as input to create a challenge, this method provides a unique random number for each user.

### ENDPOINT
`/api/auth/challenge`

### METHOD

`POST`

### (JSON) PARAMETERS

| Parameter     | Type   | Requerided | Description                                 |
| ------------- | ------ | ---------- | ------------------------------------------- |
| `walletAddress`| string | yes        | Public wallet address from user, provided by Freighter                          |

### POSIBLE RESULTS

```json
(WIP)
```

## Authentication Verification

### DESCRIPTION
Uses wallet address, signature and challenge to verify user. To new users start register process, for old accounts start login process. In any case create a session token.

*/api/auth/verify and /api/auth/wallet-login are doing the same thing.*

### ENDPOINT
`/api/auth/verify`

### METHOD

`POST`

### (JSON) PARAMETERS

| Parameter     | Type   | Requerided | Description                                 |
| ------------- | ------ | ---------- | ------------------------------------------- |
| `walletAddress`| string | yes        | Public wallet address from user, provided by Freighter                          |
| `signature`| string | yes        | ??|
| `challenge`| string | yes        | Generated from endpoint **Authentication Challenge** using wallet address |

### POSIBLE RESULTS

```json
(WIP)
```
