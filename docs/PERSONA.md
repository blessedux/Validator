# Persona API - Documentation

DOB Validator uses the Persona API to improve account security. This documentation shows relevant information about the implementation, such as its endpoints and development TODOs.

## Persona endpoints

## API/PERSONA/

## CREATE INQUIRY

### DESCRIPTION
Creates a Persona Inquiry using the configured template and optional prefilled fields.

### ENDPOINT
`/persona/inquiry`

### (JSON) PARAMETERS 

| Parameter        | Type   | Requerided | Description                    |
| ---------------- | ------ | ---------- | ------------------------------ |
| `walletAddress`  | string | yes        | User wallet address identifier |

### POSIBLE RESULTS

```json
201 CREATED
{
  "result": { "data": { "id": "inq_123", "type": "inquiry" } },
  "referenceId": "GC...WALLET"
}
```

## GENERATE ONE-TIME LINK

### DESCRIPTION
Generates a one-time link for an existing Persona Inquiry.

### ENDPOINT
`/persona/inquiry/:inquiryId/generate-one-time-link`

### (JSON) PARAMETERS 

| Parameter    | Type   | Requerided | Description          |
| ------------ | ------ | ---------- | -------------------- |
| `inquiryId`  | string | yes        | Persona Inquiry ID   |

### POSIBLE RESULTS

```json
200 OK
{
  "link": "https://withpersona.com/one-time/abc123"
}
```

## GET INQUIRY

### DESCRIPTION
Gets the latest inquiry by referenceID and updates its status in DB.

### ENDPOINT
`/persona/inquiry/:referenceID`

### (JSON) PARAMETERS 

| Parameter      | Type   | Requerided | Description                 |
| -------------- | ------ | ---------- | --------------------------- |
| `referenceID`  | string | yes        | Local reference identifier  |

### POSIBLE RESULTS

```json
200 OK
{
  "status": "completed",
  "updatedRows": 1
}
```

## SET INQUIRY PENDING

### DESCRIPTION
Sets the inquiry status to pending for the given referenceID.

### ENDPOINT
`/persona/inquiry/:referenceID`

### (JSON) PARAMETERS 

| Parameter      | Type   | Requerided | Description                 |
| -------------- | ------ | ---------- | --------------------------- |
| `referenceID`  | string | yes        | Local reference identifier  |

### POSIBLE RESULTS

```json
200 OK
{
  "status": "pending",
  "updatedRows": 1
}
```