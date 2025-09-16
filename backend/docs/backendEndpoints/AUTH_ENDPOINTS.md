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

## CORRECT REQUEST
```json
200 OK
{
    "success": true,
    "challenge": "DOB_VALIDATOR_AUTH_<randomNumber>"
}
```
## NO WALLET ADDRESS
```json
400 BAD REQUEST
{
    "error": "Wallet address is required"
}
```
## ERROR
```json
500 INTERNAL SERVER ERROR
{
    "error": "Failed to generate challenge"
}
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

## CORRECT REQUEST
```json
200 OK
{
    "success": true,
    "token": "<jwtToken>",
    "expiresIn": "<expireTimeInSeconds>",
    "user": {
        "id": "<id>",
        "walletAddress": "<walletAddress>",
        "email": "email",
        "name": "name",
        "company": "company",
        "role": "<userRol>",
        "createdAt": "<userCreationDate>",
        "updatedAt": "<userCreationDateUpdate>",
        "profile": "<profileRef>"
    }
}
```
## INVALID CHALLENGE
```json
401 UNAUTHORIZED
{
    "error": "Invalid or expired challenge"
}
```
## INVALID SIGNATURE
```json
401 UNAUTHORIZED
{
    "error": "Invalid signature"
}
```
## ERROR
```json
500 INTERNAL SERVER ERROR
{
    "error": "Failed to verify signature"
}
```