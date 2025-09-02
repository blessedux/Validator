# DOB Validator - Phase II: File Upload Implementation

## Overview

Phase II focuses on implementing a comprehensive file upload system that stores PDFs and images directly in the database with compression, preview functionality, and efficient file management. This replaces the current temporary file storage approach with a production-ready solution.

## Current State

- Basic file upload UI exists but files are not stored in database
- Review page shows file names only, no previews
- Backend has multer setup but uses memory storage
- No file compression or optimization
- No file management (replace/delete) functionality

## Target End State

- Files stored as BYTEA in PostgreSQL database
- Automatic image compression (JPEG/PNG to WebP, max 1920x1080)
- PDF compression with thumbnail generation
- File previews in form review page
- File management (replace/delete) before submission
- Efficient storage with deduplication
- Production-ready file validation and security

## Implementation Approach

### Phase 1: Core Infrastructure (Week 1-2)

- Update database schema for file storage
- Install and configure compression libraries
- Implement backend file processing service
- Create file upload endpoints with database storage

### Phase 2: Frontend Integration (Week 3-4)

- Update file upload components
- Implement file preview system
- Add file management in review page
- Create file validation and progress tracking

### Phase 3: Optimization & Testing (Week 5-6)

- Implement file deduplication
- Add caching and performance optimization
- Comprehensive testing and quality assurance
- Production deployment preparation

## Task Breakdown

### Backend Database Schema Updates

- [x] Modify DraftFile and SubmissionFile models to use BYTEA for file content
- [x] Add compression fields (compressed size, ratio, algorithm)
- [x] Add preview fields (thumbnail data, dimensions, format)
- [x] Add validation fields (hash, status, metadata)
- [ ] Update file size limits and constraints

### Backend Dependencies & Libraries

- [x] Install sharp for image processing and compression
- [x] Install pdf-lib for PDF manipulation
- [ ] Install file-type for MIME type detection
- [ ] Install uuid for unique file identifiers
- [ ] Install pdf2pic for PDF to image conversion

### Backend API Endpoint Updates

- [ ] Update /api/drafts POST to store files in database
- [ ] Update /api/drafts PUT to handle file updates
- [ ] Add DELETE /api/drafts/:id/files/:fileId for file deletion
- [x] Add GET /api/files/:fileId/preview for file previews
- [x] Add GET /api/files/:fileId/original for original downloads
- [ ] Add POST /api/files/compress for on-demand compression

### Backend File Processing Service

- [x] Create FileProcessingService class
- [x] Implement image compression (JPEG/PNG to WebP, max 1920x1080)
- [ ] Implement PDF compression with thumbnail generation
- [ ] Add file validation and integrity checking
- [x] Implement file hash generation for deduplication
- [ ] Add malware scanning and content validation

### Frontend File Upload Components

- [ ] Update DeviceDocumentation component for actual file uploads
- [ ] Create PDFPreview component with first page thumbnail
- [ ] Create ImagePreview component with zoom/pan functionality
- [ ] Add FileInfoDisplay component showing compression results
- [ ] Implement drag & drop file replacement
- [ ] Add file upload progress indicators

### Frontend Form Review Updates

- [ ] Update /form/review to display actual uploaded files
- [ ] Add PDF preview with "View Full PDF" button
- [ ] Add image preview with "View Full Image" button
- [ ] Create file gallery for multiple images with lightbox
- [ ] Add file replacement functionality before submission
- [ ] Add file deletion with confirmation modal
- [ ] Display file compression results and validation status

### Frontend File Upload Logic

- [ ] Update useDraft hook for file management
- [ ] Create FileUploadService for handling uploads
- [ ] Add client-side file validation
- [ ] Implement file compression preview
- [ ] Add file progress tracking and error handling

### File Storage Strategy

- [ ] Implement database storage using PostgreSQL BYTEA
- [ ] Add file deduplication using hash-based comparison
- [ ] Create cleanup strategy for temporary files
- [ ] Implement backup strategy for file data
- [ ] Add lazy loading for large files

### Performance Optimizations

- [ ] Implement lazy loading for file previews
- [ ] Add caching for compressed file previews
- [ ] Implement progressive uploads for large files
- [ ] Add background processing for file compression
- [ ] Consider CDN integration for file delivery

### Security & Validation

- [ ] Implement strict file type validation
- [ ] Enforce file size limits (5MB images, 10MB PDFs)
- [ ] Add basic malware scanning
- [ ] Implement access control for user files
- [ ] Add file name and metadata sanitization

### Testing & Quality Assurance

- [ ] Test file upload with various types and sizes
- [ ] Verify compression quality and file size reduction
- [ ] Test PDF and image preview functionality
- [ ] Performance testing with large files
- [ ] Cross-browser compatibility testing
- [ ] Integration testing for complete upload flow

## Technical Specifications

### File Size Limits

- Images: Maximum 5MB (compressed to optimal size)
- PDFs: Maximum 10MB (compressed while maintaining quality)

### Compression Standards

- Images: 80-85% quality, max 1920x1080, WebP conversion
- PDFs: Maintain text quality, generate first page thumbnail

### Database Storage

- Files stored as BYTEA in PostgreSQL
- Compression metadata stored separately
- Preview thumbnails stored as separate BYTEA fields

### Security Requirements

- File type validation (PDF, JPEG, PNG only)
- Size limit enforcement
- User access control
- Basic content validation

## Success Criteria

- Files upload successfully to database with compression
- PDFs display first page thumbnails in review
- Images show compressed previews with zoom capability
- Users can replace/delete files before submission
- File upload process is smooth and user-friendly
- System handles concurrent uploads efficiently
- No breaking changes to existing functionality

## Risk Mitigation

- Implement feature flags for gradual rollout
- Maintain backward compatibility during transition
- Add comprehensive error handling and fallbacks
- Test thoroughly before production deployment
- Monitor performance and storage usage

## Dependencies

- PostgreSQL database with BYTEA support
- Node.js backend with sufficient memory for file processing
- Frontend with modern browser support for file APIs
- Adequate storage capacity for file content

## Timeline

- **Week 1-2**: Backend infrastructure and database updates
- **Week 3-4**: Frontend integration and preview system
- **Week 5-6**: Optimization, testing, and deployment
- **Total**: 6 weeks for complete implementation

## Notes

- This implementation replaces temporary file storage with permanent database storage
- File compression reduces storage costs and improves performance
- Preview system enhances user experience without requiring full downloads
- All existing functionality remains intact during implementation
