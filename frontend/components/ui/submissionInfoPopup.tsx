interface SubmissionInfoPopupProps {
    itemId: string;
    itemStatus: string;
    items: any;
    onClose?: () => void;
}

export function SubmissionInfoPopup({
    itemId,
    itemStatus,
    items,
    onClose
}: SubmissionInfoPopupProps) {
    const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (e.target === e.currentTarget && onClose) {
            onClose();
        }
    };

    console.log("SubmissionInfoPopup - itemId:", itemId);
    console.log("SubmissionInfoPopup - itemStatus:", itemStatus);
    console.log("SubmissionInfoPopup - items:", items);

    const getContentByStatus = () => {
        if (!items) return <p>No data available</p>;

        const status = items.status;
        
        if (status === "APPROVED" || status === "approved") {
            return (
                <div>
                    <h3 className="text-lg font-semibold mb-3 text-green-600">Certificate Information</h3>
                    <div className="space-y-2">
                        <p><strong>Device Name:</strong> {items.deviceName || "N/A"}</p>
                        <p><strong>Device Type:</strong> {items.deviceType || "N/A"}</p>
                        <p><strong>Location:</strong> {items.location || "N/A"}</p>
                        <p><strong>Status:</strong> <span className="text-green-600">Approved</span></p>
                        {items.certificateId && (
                            <p><strong>Certificate ID:</strong> {items.certificateId}</p>
                        )}
                        <p><strong>Approved Date:</strong> {items.updatedAt ? new Date(items.updatedAt).toLocaleDateString() : "N/A"}</p>
                    </div>
                </div>
            );
        } else if (status === "REJECTED" || status === "rejected") {
            return (
                <div>
                    <h3 className="text-lg font-semibold mb-3 text-red-600">Rejection Information</h3>
                    <div className="space-y-2">
                        <p><strong>Device Name:</strong> {items.deviceName || "N/A"}</p>
                        <p><strong>Device Type:</strong> {items.deviceType || "N/A"}</p>
                        <p><strong>Status:</strong> <span className="text-red-600">Rejected</span></p>
                        <p><strong>Rejection Reason:</strong> {items.rejectionReason || "N/A"}</p>
                        <p><strong>Rejected Date:</strong> {items.updatedAt ? new Date(items.updatedAt).toLocaleDateString() : "N/A"}</p>
                    </div>
                </div>
            );
        } else {
            return (
                <div>
                    <h3 className="text-lg font-semibold mb-3">Submission Information</h3>
                    <div className="space-y-2">
                        <p><strong>Device Name:</strong> {items.deviceName || "N/A"}</p>
                        <p><strong>Device Type:</strong> {items.deviceType || "N/A"}</p>
                        <p><strong>Location:</strong> {items.location || "N/A"}</p>
                        <p><strong>Status:</strong> {status || "Unknown"}</p>
                        <p><strong>Last Updated:</strong> {items.updatedAt ? new Date(items.updatedAt).toLocaleDateString() : "N/A"}</p>
                    </div>
                </div>
            );
        }
    };

    return (
        <>
            {itemStatus === "opened" && (
                <div
                    className="fixed bg-black bg-opacity-30 top-0 left-0 w-full h-full z-50 flex justify-center items-center cursor-pointer"
                    onClick={handleOverlayClick}
                >
                    <div
                        className="bg-black rounded-lg p-8 max-w-2xl w-full mx-4 shadow-2xl cursor-default"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-bold ">Submission Review</h2>
                            {onClose && (
                                <button
                                    onClick={onClose}
                                    className="text-gray-500 hover:text-gray-700 text-2xl font-bold w-8 h-8 flex items-center justify-center rounded"
                                >
                                    ×
                                </button>
                            )}
                        </div>
                        
                        <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                            <p className="text-sm text-gray-600 mb-2"><strong>Submission ID:</strong> {itemId}</p>
                        </div>
                        
                        {getContentByStatus()}
                    </div>
                </div>
            )}
        </>
    );
}