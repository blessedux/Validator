# Drafts Endpoints - Documentation

Drafts are temporal submissions automatically generated at the moment of creating a new submission and not end the process.
Then they are used to create a new submission.

## Get Drafts

### DESCRIPTION
Gets all drafts from a wallet address.

### ENDPOINT
`/api/drafts`

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

## Create a Draft

### DESCRIPTION
Create a new draft.

### ENDPOINT
`/api/drafts`

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

## Create Submission

### DESCRIPTION
Create a new submission.

### ENDPOINT
`/api/drafts`

### METHOD

`POST`

### (JSON) PARAMETERS

| Parameter     | Type    | Requerided          | Description                                 |
| ------------- | ------- | ------------------- | ------------------------------------------- |
| `deviceName`| string  | yes                 | Input for device name|
| `deviceType`| string  | yes                 | Input for device type|
| `location`| string  | yes                 | Input for device location|
| `serialNumber`| string  | yes                 | Input for device serial number|
| `manufacturer`| string  | yes                 | Input for device manufacturer|
| `model`| string  | yes                 | Input for device model|
| `yearOfManufacture`| string  | yes                 | Input for device year of manufacture|
| `condition`| string  | yes                 | Input for device condition|
| `specifications`| string  | yes                 | Input for device specifications|
| `purchasePrice`| string  | yes                 | Input for device purchase price|
| `currentValue`| string  | yes                 | Input for device current value|
| `expectedValue`| string  | yes                 | Input for device expected value|
| `operationalCost`| string  | yes                 | Input for device operational cost|
| `technicalCetificationId`| file  | no                 | Document for device technical certification|
| `purchaseProofId`| file  | no                 | Document for device purchase proof|
| `maintenanceRecordsId`| file  | no                 | Document for device maintenance records|
| `deviceImageID`| file  | no                 | Document for device device image|

### POSIBLE RESULTS

```json
(WIP)
```

## Get Drafts

### DESCRIPTION
Get drafts by wallet address and draft id

### ENDPOINT
`/api/drafts/:id`

### METHOD

`GET`

### (JSON) PARAMETERS

| Parameter     | Type    | Requerided          | Description                                 |
| ------------- | ------- | ------------------- | ------------------------------------------- |
| `walletAddress encoded`| string | yes        | User wallet address encoded as authHeader, sended automatically from cache  |
| `draftId`| string | yes        | Draft id generated in db|

### POSIBLE RESULTS

```json
(WIP)
```

## Update Drafts

### DESCRIPTION
Update drafts by wallet address and draft id

### ENDPOINT
`/api/drafts/:id`

### METHOD

`GET`

### (JSON) PARAMETERS

| Parameter     | Type    | Requerided          | Description                                 |
| ------------- | ------- | ------------------- | ------------------------------------------- |
| `walletAddress encoded`| string | yes        | User wallet address encoded as authHeader, sended automatically from cache  |
| `draftId`| string | yes        | Draft id generated in db|
| `deviceName`| string  | no                 | Input for device name|
| `deviceType`| string  | no                 | Input for device type|
| `location`| string  | no              | Input for device location|
| `serialNumber`| string  | no                 | Input for device serial number|
| `manufacturer`| string  | no                 | Input for device manufacturer|
| `model`| string  | np                 | Input for device model|
| `yearOfManufacture`| string  | no                 | Input for device year of manufacture|
| `condition`| string  | no                 | Input for device condition|
| `specifications`| string  | no                 | Input for device specifications|
| `purchasePrice`| string  | no                 | Input for device purchase price|
| `currentValue`| string  | no                 | Input for device current value|
| `expectedValue`| string  | no                 | Input for device expected value|
| `operationalCost`| string  | no                 | Input for device operational cost|
| `technicalCetificationId`| file  | no                 | Document for device technical certification|
| `purchaseProofId`| file  | no                 | Document for device purchase proof|
| `maintenanceRecordsId`| file  | no                 | Document for device maintenance records|
| `deviceImageID`| file  | no                 | Document for device device image|

### POSIBLE RESULTS

```json
(WIP)
```
## Delete Specific Draft

### DESCRIPTION
Delete specific draft search by wallet address and draft id

### ENDPOINT
`/api/drafts/:id`

### METHOD

`DELETE`

### (JSON) PARAMETERS

| Parameter     | Type    | Requerided          | Description                                 |
| ------------- | ------- | ------------------- | ------------------------------------------- |
| `walletAddress encoded`| string | yes        | User wallet address encoded as authHeader, sended automatically from cache  |
| `draftId`| string | yes        | Draft id generated in db|

### POSIBLE RESULTS

```json
(WIP)
```
