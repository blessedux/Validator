# Utils Endpoints - Documentation

Some endpoints which are difficult to agroup.


## Health

### DESCRIPTION
Shows relevant backend information.

### ENDPOINT
`/health`

### METHOD

`GET`

### (JSON) PARAMETERS

NONE

### POSIBLE RESULTS

```json
(WIP)
```

## Ping-pong

### DESCRIPTION
Answers a ping to pong, used to check if backend can respond.

### ENDPOINT
`/api/ping`

### METHOD

`GET`

### (JSON) PARAMETERS

NONE

### POSIBLE RESULTS

```json
(WIP)
```
## Database Test

### DESCRIPTION
Endpoint used at development to verify database response

### ENDPOINT
`/test-db`

### METHOD

`GET`

### (JSON) PARAMETERS

NONE

### POSIBLE RESULTS

```json
(WIP)
```

## Deployment Endpoints

### DESCRIPTION
(?)

### ENDPOINT
`/api/deployments`

### METHOD

`GET`

### (JSON) PARAMETERS

NONE

### POSIBLE RESULTS

```json
(WIP)
```

## Deployment Stats

### DESCRIPTION
(?)

### ENDPOINT
`/api/deployments/stats`

### METHOD

`GET`

### (JSON) PARAMETERS

NONE

### POSIBLE RESULTS

```json
(WIP)
```

## Deployment Stats Lastest

### DESCRIPTION
(?)

### ENDPOINT
`/api/deployments/stats/:environment`

### METHOD

`GET`

### (JSON) PARAMETERS

NONE

### POSIBLE RESULTS

```json
(WIP)
```

## Get Profiles Admin View

### DESCRIPTION
Shows all profile with all information

### ENDPOINT
`/api/admin/profiles`

### METHOD

`GET`

### (JSON) PARAMETERS

| Parameter     | Type    | Requerided          | Description                                 |
| ------------- | ------- | ------------------- | ------------------------------------------- |
| `walletAddress encoded`| string | yes        | User wallet address encoded as authHeader, sended automatically from cache  |

### POSIBLE RESULTS

```json
(WIP)
```
