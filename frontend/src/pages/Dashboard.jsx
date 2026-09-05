import { useEffect, useState } from "react";

function Dashboard() {
    // =========================================================
    // STATE
    // =========================================================

    const [files, setFiles] = useState([]);
    const [folders, setFolders] = useState([]);
    const [starredItems, setStarredItems] = useState([]);

    const [loadingFiles, setLoadingFiles] = useState(true);
    const [loadingFolders, setLoadingFolders] = useState(true);
    const [loadingStars, setLoadingStars] = useState(false);
    const [trashFiles, setTrashFiles] = useState([]);
    const [loadingTrash, setLoadingTrash] = useState(false);
    const [receivedShares, setReceivedShares] = useState([]);
    const [sentShares, setSentShares] = useState([]);
    const [loadingShares, setLoadingShares] = useState(false);

    // Share modal
    const [showShareModal, setShowShareModal] = useState(false);
    const [shareTarget, setShareTarget] = useState(null);
    const [shareTargetType, setShareTargetType] = useState(null);
    const [recipientUserId, setRecipientUserId] = useState("");
    const [sharePermission, setSharePermission] = useState("VIEWER");
    const [sharing, setSharing] = useState(false);
    const [shareMessage, setShareMessage] = useState("");

    const [uploading, setUploading] = useState(false);
    const [uploadMessage, setUploadMessage] = useState("");

    const [storageUsage, setStorageUsage] = useState({
        plan: "Free",
        used_bytes: 0,
        limit_bytes: 5 * 1024 * 1024 * 1024,
        available_bytes: 5 * 1024 * 1024 * 1024,
        percentage: 0,
    });

    // Folder modal
    const [showFolderModal, setShowFolderModal] =
        useState(false);

    const [folderName, setFolderName] =
        useState("");

    const [creatingFolder, setCreatingFolder] =
        useState(false);

    const [folderMessage, setFolderMessage] =
        useState("");

    // Current folder
    const [currentFolderId, setCurrentFolderId] =
        useState(null);

    // Breadcrumb
    const [breadcrumbs, setBreadcrumbs] =
        useState([
            {
                id: null,
                name: "My Drive",
            },
        ]);

    // Search
    const [searchTerm, setSearchTerm] =
        useState("");

    // Rename
    const [showRenameModal, setShowRenameModal] =
        useState(false);

    const [renameType, setRenameType] =
        useState(null);

    const [renameItem, setRenameItem] =
        useState(null);

    const [renameName, setRenameName] =
        useState("");

    const [renaming, setRenaming] =
        useState(false);

    const [renameMessage, setRenameMessage] =
        useState("");

    // Three-dot menu
    const [openMenuId, setOpenMenuId] =
        useState(null);

    // Current sidebar page
    const [activePage, setActivePage] =
        useState("drive");

    // Settings & subscription
    const [displayName, setDisplayName] = useState(
        () => localStorage.getItem("vaultiq_display_name") || "User"
    );
    const [selectedPlan, setSelectedPlan] = useState(
        () => localStorage.getItem("vaultiq_plan") || "Free"
    );
    const [settingsMessage, setSettingsMessage] = useState("");

    // Change password
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [passwordMessage, setPasswordMessage] = useState("");
    const [changingPassword, setChangingPassword] = useState(false);

    const storagePlans = {
        Free: { limit: 5, price: 0 },
        Plus: { limit: 50, price: 99 },
        Pro: { limit: 200, price: 199 },
        Premium: { limit: 1024, price: 499 },
    };

    // =========================================================
    // TOKEN
    // =========================================================

    const getToken = () => {
        return localStorage.getItem(
            "access_token"
        );
    };

    // =========================================================
    // FETCH STORAGE USAGE
    // =========================================================

    const fetchStorageUsage = async () => {
        try {
            const token = getToken();
            if (!token) return;

            const response = await fetch(
                "https://vaultiq-xpyl.onrender.com/api/files/storage/usage",
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );

            if (!response.ok) return;
            const data = await response.json();
            setStorageUsage(data);
        } catch (error) {
            console.error("Storage usage error:", error);
        }
    };

    // =========================================================
    // FETCH FOLDERS
    // =========================================================

    const fetchFolders = async () => {
        try {
            setLoadingFolders(true);

            const token = getToken();

            if (!token) {
                setFolders([]);
                return;
            }

            const response = await fetch(
                "https://vaultiq-xpyl.onrender.com/api/folders",
                {
                    method: "GET",
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            if (!response.ok) {
                throw new Error(
                    "Failed to load folders."
                );
            }

            const data =
                await response.json();

            if (Array.isArray(data)) {
                setFolders(data);
            } else if (
                Array.isArray(data.folders)
            ) {
                setFolders(data.folders);
            } else if (
                Array.isArray(data.items)
            ) {
                setFolders(data.items);
            } else {
                setFolders([]);
            }
        } catch (error) {
            console.error(
                "Error fetching folders:",
                error
            );

            setFolders([]);
        } finally {
            setLoadingFolders(false);
        }
    };

    // =========================================================
    // FETCH FILES
    // =========================================================

    const fetchFiles = async (
        folderId = currentFolderId
    ) => {
        try {
            setLoadingFiles(true);

            const token = getToken();

            if (!token) {
                setFiles([]);
                return;
            }

            let url =
                "https://vaultiq-xpyl.onrender.com/api/files";

            if (folderId) {
                url += `?folder_id=${encodeURIComponent(
                    folderId
                )}`;
            }

            const response = await fetch(
                url,
                {
                    method: "GET",
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            if (!response.ok) {
                throw new Error(
                    "Failed to load files."
                );
            }

            const data =
                await response.json();

            if (Array.isArray(data)) {
                setFiles(data);
            } else if (
                Array.isArray(data.files)
            ) {
                setFiles(data.files);
            } else if (
                Array.isArray(data.items)
            ) {
                setFiles(data.items);
            } else {
                setFiles([]);
            }
        } catch (error) {
            console.error(
                "Error fetching files:",
                error
            );

            setFiles([]);
        } finally {
            setLoadingFiles(false);
        }
    };

    // =========================================================
    // FETCH STARRED ITEMS
    // =========================================================

    const fetchStarred = async () => {
        try {
            setLoadingStars(true);

            const token = getToken();

            if (!token) {
                setStarredItems([]);
                return;
            }

            const response = await fetch(
                "https://vaultiq-xpyl.onrender.com/api/stars",
                {
                    method: "GET",
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            if (!response.ok) {
                throw new Error(
                    "Failed to load starred items."
                );
            }

            const data =
                await response.json();

            if (Array.isArray(data)) {
                setStarredItems(data);
            } else if (
                Array.isArray(data.stars)
            ) {
                setStarredItems(data.stars);
            } else if (
                Array.isArray(data.items)
            ) {
                setStarredItems(data.items);
            } else {
                setStarredItems([]);
            }
        } catch (error) {
            console.error(
                "Error fetching starred items:",
                error
            );

            setStarredItems([]);
        } finally {
            setLoadingStars(false);
        }
    };

    // =========================================================
    // FETCH TRASH
    // =========================================================

    const fetchTrash = async () => {
        try {
            setLoadingTrash(true);

            const token = getToken();

            if (!token) {
                setTrashFiles([]);
                return;
            }

            const response = await fetch(
                "https://vaultiq-xpyl.onrender.com/api/trash",
                {
                    method: "GET",
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            if (!response.ok) {
                throw new Error("Failed to load trash.");
            }

            const data = await response.json();

            if (Array.isArray(data)) {
                setTrashFiles(data);
            } else if (Array.isArray(data.files)) {
                setTrashFiles(data.files);
            } else if (Array.isArray(data.items)) {
                setTrashFiles(data.items);
            } else {
                setTrashFiles([]);
            }
        } catch (error) {
            console.error("Error fetching trash:", error);
            setTrashFiles([]);
        } finally {
            setLoadingTrash(false);
        }
    };

    // =========================================================
    // FETCH RECEIVED SHARES
    // =========================================================

    const fetchReceivedShares = async () => {
        try {
            setLoadingShares(true);

            const token = getToken();

            if (!token) {
                setReceivedShares([]);
                return;
            }

            const response = await fetch(
                "https://vaultiq-xpyl.onrender.com/api/shares/received",
                {
                    method: "GET",
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            if (!response.ok) {
                throw new Error("Failed to load shared files.");
            }

            const data = await response.json();

            if (Array.isArray(data)) {
                setReceivedShares(data);
            } else if (Array.isArray(data.shares)) {
                setReceivedShares(data.shares);
            } else {
                setReceivedShares([]);
            }
        } catch (error) {
            console.error("Error fetching received shares:", error);
            setReceivedShares([]);
        } finally {
            setLoadingShares(false);
        }
    };

    // =========================================================
    // OPEN SHARED WITH ME
    // =========================================================

    const handleOpenShared = () => {
        setActivePage("shared");
        setSearchTerm("");
        setOpenMenuId(null);
        fetchReceivedShares();
    };

    // =========================================================
    // SHARE MODAL
    // =========================================================

    const openShareModal = (item, type) => {
        setShareTarget(item);
        setShareTargetType(type);
        setRecipientUserId("");
        setSharePermission("VIEWER");
        setShareMessage("");
        setOpenMenuId(null);
        setShowShareModal(true);
    };

    const closeShareModal = () => {
        setShowShareModal(false);
        setShareTarget(null);
        setShareTargetType(null);
        setRecipientUserId("");
        setSharePermission("VIEWER");
        setShareMessage("");
    };

    // =========================================================
    // CREATE SHARE
    // =========================================================

    const handleCreateShare = async (event) => {
        event.preventDefault();

        const userId = recipientUserId.trim();

        if (!userId) {
            setShareMessage("Please enter the recipient User ID.");
            return;
        }

        if (!shareTarget) {
            setShareMessage("No file or folder selected.");
            return;
        }

        try {
            setSharing(true);
            setShareMessage("");

            const token = getToken();

            if (!token) {
                throw new Error("You are not logged in.");
            }

            const endpoint =
                shareTargetType === "file"
                    ? `https://vaultiq-xpyl.onrender.com/api/shares/file/${shareTarget.id}`
                    : `https://vaultiq-xpyl.onrender.com/api/shares/folder/${shareTarget.id}`;

            const response = await fetch(endpoint, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    shared_with_user_id: userId,
                    permission: sharePermission,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.detail || "Failed to share item."
                );
            }

            setSentShares((previous) => [
                ...previous.filter((item) => item.id !== data.id),
                {
                    ...data,
                    target_name:
                        shareTarget.name || shareTarget.original_name,
                    target_type: shareTargetType,
                },
            ]);

            setShareMessage("✓ Shared successfully!");
            setRecipientUserId("");

            setTimeout(() => {
                closeShareModal();
            }, 900);
        } catch (error) {
            console.error("Create share error:", error);
            setShareMessage(
                `✕ ${error.message || "Failed to share item."}`
            );
        } finally {
            setSharing(false);
        }
    };

    // =========================================================
    // UPDATE SHARE PERMISSION
    // =========================================================

    const handleUpdateShare = async (shareId, permission) => {
        try {
            const token = getToken();

            if (!token) {
                throw new Error("You are not logged in.");
            }

            const response = await fetch(
                `https://vaultiq-xpyl.onrender.com/api/shares/${shareId}`,
                {
                    method: "PATCH",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({
                        permission,
                    }),
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.detail || "Failed to update permission."
                );
            }

            setSentShares((previous) =>
                previous.map((share) =>
                    share.id === shareId
                        ? { ...share, permission: data.permission }
                        : share
                )
            );
        } catch (error) {
            console.error("Update share error:", error);
            alert(error.message || "Failed to update permission.");
        }
    };

    // =========================================================
    // REMOVE SHARE
    // =========================================================

    const handleRemoveShare = async (share) => {
        const confirmed = window.confirm(
            "Remove this sharing permission?"
        );

        if (!confirmed) {
            return;
        }

        try {
            const token = getToken();

            if (!token) {
                throw new Error("You are not logged in.");
            }

            const response = await fetch(
                `https://vaultiq-xpyl.onrender.com/api/shares/${share.id}`,
                {
                    method: "DELETE",
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.detail || "Failed to remove share."
                );
            }

            setSentShares((previous) =>
                previous.filter((item) => item.id !== share.id)
            );
        } catch (error) {
            console.error("Remove share error:", error);
            alert(error.message || "Failed to remove share.");
        }
    };

    // =========================================================
    // INITIAL LOAD
    // =========================================================

    useEffect(() => {
        fetchFolders();
        fetchFiles(null);
        fetchStarred();
        fetchTrash();
        fetchReceivedShares();

        fetchStorageUsage();
    }, []);

    // =========================================================
    // OPEN FOLDER
    // =========================================================

    const handleOpenFolder = (
        folder
    ) => {
        setOpenMenuId(null);
        setSearchTerm("");
        setActivePage("drive");

        setCurrentFolderId(
            folder.id
        );

        setBreadcrumbs(
            (previous) => [
                ...previous,
                {
                    id: folder.id,
                    name: folder.name,
                },
            ]
        );

        fetchFiles(folder.id);
    };

    // =========================================================
    // BREADCRUMB
    // =========================================================

    const handleBreadcrumbClick = (
        index
    ) => {
        const selectedBreadcrumb =
            breadcrumbs[index];

        const newBreadcrumbs =
            breadcrumbs.slice(
                0,
                index + 1
            );

        setBreadcrumbs(
            newBreadcrumbs
        );

        setCurrentFolderId(
            selectedBreadcrumb.id
        );

        setSearchTerm("");
        setActivePage("drive");

        fetchFiles(
            selectedBreadcrumb.id
        );

        setOpenMenuId(null);
    };

    // =========================================================
    // GO HOME
    // =========================================================

    const handleGoHome = () => {
        setCurrentFolderId(null);

        setBreadcrumbs([
            {
                id: null,
                name: "My Drive",
            },
        ]);

        setSearchTerm("");
        setActivePage("drive");

        fetchFiles(null);

        setOpenMenuId(null);
    };

    // =========================================================
    // OPEN STARRED PAGE
    // =========================================================

    const handleOpenStarred = () => {
        setActivePage("starred");
        setSearchTerm("");
        setOpenMenuId(null);
        fetchStarred();
        fetchStorageUsage();
    };

    // =========================================================
    // OPEN TRASH PAGE
    // =========================================================

    const handleOpenTrash = () => {
        setActivePage("trash");
        setSearchTerm("");
        setOpenMenuId(null);
        fetchTrash();
    };

    // =========================================================
    // RESTORE FILE FROM TRASH
    // =========================================================

    const handleRestoreFile = async (file) => {
        try {
            const token = getToken();

            if (!token) {
                throw new Error("You are not logged in.");
            }

            const response = await fetch(
                `https://vaultiq-xpyl.onrender.com/api/trash/${file.id}/restore`,
                {
                    method: "POST",
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.detail || "Failed to restore file."
                );
            }

            await fetchTrash();
            await fetchFiles(currentFolderId);
        } catch (error) {
            console.error("Restore file error:", error);
            alert(
                error.message || "Failed to restore file."
            );
        }
    };

    // =========================================================
    // PERMANENT DELETE
    // =========================================================

    const handlePermanentDelete = async (file) => {
        const confirmed = window.confirm(
            `Permanently delete "${file.name || file.original_name}"? This action cannot be undone.`
        );

        if (!confirmed) {
            return;
        }

        try {
            const token = getToken();

            if (!token) {
                throw new Error("You are not logged in.");
            }

            const response = await fetch(
                `https://vaultiq-xpyl.onrender.com/api/trash/${file.id}/permanent`,
                {
                    method: "DELETE",
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.detail || "Failed to permanently delete file."
                );
            }

            await fetchTrash();
        } catch (error) {
            console.error(
                "Permanent delete error:",
                error
            );

            alert(
                error.message ||
                "Failed to permanently delete file."
            );
        }
    };

    // =========================================================
    // CREATE FOLDER
    // =========================================================

    const handleCreateFolder = async (
        event
    ) => {
        event.preventDefault();

        const name =
            folderName.trim();

        if (!name) {
            setFolderMessage(
                "Please enter a folder name."
            );
            return;
        }

        try {
            setCreatingFolder(true);
            setFolderMessage("");

            const token = getToken();

            if (!token) {
                throw new Error(
                    "You are not logged in."
                );
            }

            const response =
                await fetch(
                    "https://vaultiq-xpyl.onrender.com/api/folders",
                    {
                        method: "POST",
                        headers: {
                            "Content-Type":
                                "application/json",
                            Authorization: `Bearer ${token}`,
                        },
                        body: JSON.stringify({
                            name: name,
                            parent_id:
                                currentFolderId,
                        }),
                    }
                );

            const data =
                await response.json();

            if (!response.ok) {
                throw new Error(
                    data.detail ||
                    "Failed to create folder."
                );
            }

            setFolderMessage(
                "✓ Folder created successfully!"
            );

            setFolderName("");

            await fetchFolders();

            setTimeout(() => {
                setShowFolderModal(false);
                setFolderMessage("");
            }, 800);
        } catch (error) {
            console.error(
                "Create folder error:",
                error
            );

            setFolderMessage(
                `✕ ${error.message ||
                "Failed to create folder."
                }`
            );
        } finally {
            setCreatingFolder(false);
        }
    };

    // =========================================================
    // UPLOAD FILE
    // =========================================================

    const handleUpload = async (
        event
    ) => {
        const file =
            event.target.files[0];

        if (!file) return;

        setUploading(true);
        setUploadMessage("");

        try {
            const token = getToken();

            if (!token) {
                throw new Error(
                    "You are not logged in."
                );
            }

            const formData =
                new FormData();

            formData.append(
                "file",
                file
            );

            if (currentFolderId) {
                formData.append(
                    "folder_id",
                    currentFolderId
                );
            }

            const response =
                await fetch(
                    "https://vaultiq-xpyl.onrender.com/api/files/upload",
                    {
                        method: "POST",
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                        body: formData,
                    }
                );

            const data =
                await response.json();

            if (!response.ok) {
                throw new Error(
                    data.detail ||
                    "File upload failed."
                );
            }

            setUploadMessage(
                `✓ ${file.name} uploaded successfully!`
            );

            await fetchFiles(
                currentFolderId
            );
            await fetchStorageUsage();
        } catch (error) {
            console.error(
                "Upload error:",
                error
            );

            setUploadMessage(
                `✕ ${error.message ||
                "File upload failed."
                }`
            );
        } finally {
            setUploading(false);
            event.target.value = "";
        }
    };

    // =========================================================
    // OPEN / DOWNLOAD FILE
    // =========================================================

    const handleOpenFile = async (
        file
    ) => {
        const token = getToken();

        if (!token) {
            alert("Please login again.");
            return;
        }

        const newTab =
            window.open(
                "",
                "_blank"
            );

        try {
            const response =
                await fetch(
                    `https://vaultiq-xpyl.onrender.com/api/files/${file.id}/download`,
                    {
                        method: "GET",
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    }
                );

            if (!response.ok) {
                throw new Error(
                    "Unable to open file."
                );
            }

            const blob =
                await response.blob();

            const fileUrl =
                URL.createObjectURL(
                    blob
                );

            const mimeType =
                file.mime_type || "";

            const canOpenInBrowser =
                mimeType.startsWith(
                    "image/"
                ) ||
                mimeType ===
                "application/pdf" ||
                mimeType.startsWith(
                    "text/"
                );

            if (canOpenInBrowser) {
                if (newTab) {
                    newTab.location.href =
                        fileUrl;
                }
            } else {
                if (newTab) {
                    newTab.close();
                }

                const link =
                    document.createElement(
                        "a"
                    );

                link.href = fileUrl;

                link.download =
                    file.name ||
                    file.original_name ||
                    "download";

                document.body.appendChild(
                    link
                );

                link.click();

                link.remove();
            }

            setTimeout(() => {
                URL.revokeObjectURL(
                    fileUrl
                );
            }, 60000);
        } catch (error) {
            console.error(
                "Open file error:",
                error
            );

            if (newTab) {
                newTab.close();
            }

            alert(
                error.message ||
                "Unable to open or download the file."
            );
        }
    };

    // =========================================================
    // RENAME MODAL
    // =========================================================

    const openRenameModal = (
        item,
        type
    ) => {
        setRenameItem(item);
        setRenameType(type);

        setRenameName(
            item.name ||
            item.original_name ||
            ""
        );

        setRenameMessage("");
        setOpenMenuId(null);
        setShowRenameModal(true);
    };

    // =========================================================
    // RENAME
    // =========================================================

    const handleRename = async (
        event
    ) => {
        event.preventDefault();

        const newName =
            renameName.trim();

        if (!newName) {
            setRenameMessage(
                "Please enter a name."
            );
            return;
        }

        if (!renameItem) {
            return;
        }

        try {
            setRenaming(true);
            setRenameMessage("");

            const token = getToken();

            if (!token) {
                throw new Error(
                    "You are not logged in."
                );
            }

            let url = "";
            let body = {};

            if (
                renameType === "file"
            ) {
                url = `https://vaultiq-xpyl.onrender.com/api/files/${renameItem.id}/rename`;

                body = {
                    name: newName,
                };
            } else {
                url = `https://vaultiq-xpyl.onrender.com/api/folders/${renameItem.id}`;

                body = {
                    name: newName,
                };
            }

            const response =
                await fetch(url, {
                    method: "PATCH",
                    headers: {
                        "Content-Type":
                            "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify(
                        body
                    ),
                });

            const data =
                await response.json();

            if (!response.ok) {
                throw new Error(
                    data.detail ||
                    "Rename failed."
                );
            }

            setRenameMessage(
                "✓ Renamed successfully!"
            );

            if (
                renameType === "file"
            ) {
                await fetchFiles(
                    currentFolderId
                );
            } else {
                await fetchFolders();

                setBreadcrumbs(
                    (previous) =>
                        previous.map(
                            (item) =>
                                item.id ===
                                    renameItem.id
                                    ? {
                                        ...item,
                                        name: newName,
                                    }
                                    : item
                        )
                );
            }

            await fetchStarred();

            setTimeout(() => {
                setShowRenameModal(false);
                setRenameItem(null);
                setRenameName("");
                setRenameMessage("");
            }, 700);
        } catch (error) {
            console.error(
                "Rename error:",
                error
            );

            setRenameMessage(
                `✕ ${error.message ||
                "Rename failed."
                }`
            );
        } finally {
            setRenaming(false);
        }
    };

    // =========================================================
    // DELETE FILE
    // =========================================================

    const handleDeleteFile = async (
        file
    ) => {
        setOpenMenuId(null);

        const confirmed =
            window.confirm(
                `Are you sure you want to delete "${file.name || file.original_name}"?`
            );

        if (!confirmed) {
            return;
        }

        try {
            const token = getToken();

            if (!token) {
                throw new Error(
                    "You are not logged in."
                );
            }

            const response =
                await fetch(
                    `https://vaultiq-xpyl.onrender.com/api/files/${file.id}`,
                    {
                        method: "DELETE",
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    }
                );

            if (!response.ok) {
                let data = {};

                try {
                    data =
                        await response.json();
                } catch {
                    // No JSON response
                }

                throw new Error(
                    data.detail ||
                    "Failed to delete file."
                );
            }

            await fetchFiles(
                currentFolderId
            );

            await fetchStarred();
            await fetchTrash();
        } catch (error) {
            console.error(
                "Delete file error:",
                error
            );

            alert(
                error.message ||
                "Failed to delete file."
            );
        }
    };

    // =========================================================
    // DELETE FOLDER
    // =========================================================

    const handleDeleteFolder = async (
        folder
    ) => {
        setOpenMenuId(null);

        const confirmed =
            window.confirm(
                `Are you sure you want to delete "${folder.name}"?`
            );

        if (!confirmed) {
            return;
        }

        try {
            const token = getToken();

            if (!token) {
                throw new Error(
                    "You are not logged in."
                );
            }

            const response =
                await fetch(
                    `https://vaultiq-xpyl.onrender.com/api/folders/${folder.id}`,
                    {
                        method: "DELETE",
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    }
                );

            if (!response.ok) {
                let data = {};

                try {
                    data =
                        await response.json();
                } catch {
                    // No JSON response
                }

                throw new Error(
                    data.detail ||
                    "Failed to delete folder."
                );
            }

            await fetchFolders();

            await fetchFiles(
                currentFolderId
            );

            await fetchStarred();
        } catch (error) {
            console.error(
                "Delete folder error:",
                error
            );

            alert(
                error.message ||
                "Failed to delete folder."
            );
        }
    };

    // =========================================================
    // STAR FILE
    // =========================================================

    const handleStarFile = async (
        file
    ) => {
        setOpenMenuId(null);

        try {
            const token = getToken();

            if (!token) {
                throw new Error(
                    "You are not logged in."
                );
            }

            const existingStar =
                starredItems.find(
                    (star) =>
                        star.file_id ===
                        file.id
                );

            if (existingStar) {
                await handleUnstar(
                    existingStar
                );
                return;
            }

            const response =
                await fetch(
                    `https://vaultiq-xpyl.onrender.com/api/stars/file/${file.id}`,
                    {
                        method: "POST",
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    }
                );

            if (!response.ok) {
                let data = {};

                try {
                    data =
                        await response.json();
                } catch {
                    // No JSON response
                }

                throw new Error(
                    data.detail ||
                    "Failed to star file."
                );
            }

            await fetchStarred();
        } catch (error) {
            console.error(
                "Star file error:",
                error
            );

            alert(
                error.message ||
                "Failed to star file."
            );
        }
    };

    // =========================================================
    // STAR FOLDER
    // =========================================================

    const handleStarFolder = async (
        folder
    ) => {
        setOpenMenuId(null);

        try {
            const token = getToken();

            if (!token) {
                throw new Error(
                    "You are not logged in."
                );
            }

            const existingStar =
                starredItems.find(
                    (star) =>
                        star.folder_id ===
                        folder.id
                );

            if (existingStar) {
                await handleUnstar(
                    existingStar
                );
                return;
            }

            const response =
                await fetch(
                    `https://vaultiq-xpyl.onrender.com/api/stars/folder/${folder.id}`,
                    {
                        method: "POST",
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    }
                );

            if (!response.ok) {
                let data = {};

                try {
                    data =
                        await response.json();
                } catch {
                    // No JSON response
                }

                throw new Error(
                    data.detail ||
                    "Failed to star folder."
                );
            }

            await fetchStarred();
        } catch (error) {
            console.error(
                "Star folder error:",
                error
            );

            alert(
                error.message ||
                "Failed to star folder."
            );
        }
    };

    // =========================================================
    // UNSTAR
    // =========================================================

    const handleUnstar = async (
        star
    ) => {
        try {
            const token = getToken();

            if (!token) {
                throw new Error(
                    "You are not logged in."
                );
            }

            const response =
                await fetch(
                    `https://vaultiq-xpyl.onrender.com/api/stars/${star.id}`,
                    {
                        method: "DELETE",
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    }
                );

            if (!response.ok) {
                let data = {};

                try {
                    data =
                        await response.json();
                } catch {
                    // No JSON response
                }

                throw new Error(
                    data.detail ||
                    "Failed to remove star."
                );
            }

            await fetchStarred();
        } catch (error) {
            console.error(
                "Unstar error:",
                error
            );

            alert(
                error.message ||
                "Failed to remove star."
            );
        }
    };

    // =========================================================
    // CHECK IF FILE IS STARRED
    // =========================================================

    const isFileStarred = (
        fileId
    ) => {
        return starredItems.some(
            (star) =>
                star.file_id ===
                fileId
        );
    };

    // =========================================================
    // CHECK IF FOLDER IS STARRED
    // =========================================================

    const isFolderStarred = (
        folderId
    ) => {
        return starredItems.some(
            (star) =>
                star.folder_id ===
                folderId
        );
    };

    // =========================================================
    // GET STARRED FILE/FOLDER DETAILS
    // =========================================================

    const getStarredFile = (
        star
    ) => {
        if (!star.file_id) {
            return null;
        }

        return files.find(
            (file) =>
                file.id ===
                star.file_id
        );
    };

    const getStarredFolder = (
        star
    ) => {
        if (!star.folder_id) {
            return null;
        }

        return folders.find(
            (folder) =>
                folder.id ===
                star.folder_id
        );
    };

    // =========================================================
    // FILE ICON
    // =========================================================

    const getFileIcon = (
        file
    ) => {
        const mimeType =
            file.mime_type || "";

        if (
            mimeType.startsWith(
                "image/"
            )
        ) {
            return "🖼️";
        }

        if (
            mimeType ===
            "application/pdf"
        ) {
            return "📕";
        }

        if (
            mimeType.includes(
                "word"
            ) ||
            mimeType.includes(
                "document"
            )
        ) {
            return "📘";
        }

        if (
            mimeType.includes(
                "excel"
            ) ||
            mimeType.includes(
                "spreadsheet"
            )
        ) {
            return "📗";
        }

        if (
            mimeType.includes(
                "zip"
            ) ||
            mimeType.includes(
                "rar"
            ) ||
            mimeType.includes(
                "compressed"
            )
        ) {
            return "📦";
        }

        if (
            mimeType.startsWith(
                "video/"
            )
        ) {
            return "🎬";
        }

        if (
            mimeType.startsWith(
                "audio/"
            )
        ) {
            return "🎵";
        }

        if (
            mimeType.includes(
                "text"
            )
        ) {
            return "📄";
        }

        return "📁";
    };

    // =========================================================
    // FILE SIZE
    // =========================================================

    const formatFileSize = (
        bytes
    ) => {
        if (!bytes || bytes === 0) {
            return "0 Bytes";
        }

        const sizes = [
            "Bytes",
            "KB",
            "MB",
            "GB",
            "TB",
        ];

        const i = Math.floor(
            Math.log(bytes) /
            Math.log(1024)
        );

        return (
            parseFloat(
                (
                    bytes /
                    Math.pow(1024, i)
                ).toFixed(2)
            ) +
            " " +
            sizes[i]
        );
    };

    // =========================================================
    // CURRENT FOLDER
    // =========================================================

    const currentFolders =
        folders.filter(
            (folder) =>
                (folder.parent_id ??
                    null) ===
                currentFolderId
        );

    // =========================================================
    // SEARCH
    // =========================================================

    const filteredFolders =
        currentFolders.filter(
            (folder) =>
                folder.name
                    .toLowerCase()
                    .includes(
                        searchTerm.toLowerCase()
                    )
        );

    const filteredFiles =
        files.filter((file) =>
            (
                file.name ||
                file.original_name ||
                ""
            )
                .toLowerCase()
                .includes(
                    searchTerm.toLowerCase()
                )
        );

    // =========================================================
    // STARRED SEARCH
    // =========================================================

    const filteredStarredItems =
        starredItems.filter(
            (star) => {
                const file =
                    getStarredFile(star);

                const folder =
                    getStarredFolder(star);

                const name =
                    file?.name ||
                    file?.original_name ||
                    folder?.name ||
                    "";

                return name
                    .toLowerCase()
                    .includes(
                        searchTerm.toLowerCase()
                    );
            }
        );

    // =========================================================
    // TRASH SEARCH
    // =========================================================

    const filteredTrashFiles =
        trashFiles.filter((file) =>
            (
                file.name ||
                file.original_name ||
                ""
            )
                .toLowerCase()
                .includes(
                    searchTerm.toLowerCase()
                )
        );

    // =========================================================
    // STORAGE
    // =========================================================

    const totalStorage = Number(storageUsage.used_bytes || 0);
    const totalStorageMB = totalStorage / (1024 * 1024);
    const currentPlan = storagePlans[storageUsage.plan] || storagePlans.Free;
    const storageLimit = Number(storageUsage.limit_bytes || currentPlan.limit * 1024 * 1024 * 1024);
    const storagePercentage = Number(storageUsage.percentage || 0);

    // =========================================================
    // LOGOUT
    // =========================================================

    const handleLogout = () => {
        localStorage.removeItem(
            "access_token"
        );

        localStorage.removeItem(
            "refresh_token"
        );

        window.location.reload();
    };

    // =========================================================
    // REFRESH
    // =========================================================

    const handleRefresh = () => {
        fetchFolders();
        fetchFiles(currentFolderId);
        fetchStarred();
        fetchTrash();
        fetchReceivedShares();
    };

    // =========================================================
    // SETTINGS / SUBSCRIPTION
    // =========================================================

    const saveSettings = () => {
        localStorage.setItem("vaultiq_display_name", displayName.trim() || "User");
        setDisplayName(displayName.trim() || "User");
        setSettingsMessage("✓ Settings saved successfully.");
    };

    const handleChangePassword = async (event) => {
        event.preventDefault();
        setPasswordMessage("");

        if (!currentPassword || !newPassword || !confirmPassword) {
            setPasswordMessage("Please fill in all password fields.");
            return;
        }

        if (newPassword.length < 8) {
            setPasswordMessage("New password must be at least 8 characters long.");
            return;
        }

        if (newPassword !== confirmPassword) {
            setPasswordMessage("New password and confirmation do not match.");
            return;
        }

        try {
            setChangingPassword(true);

            const token = getToken();
            if (!token) {
                throw new Error("You are not logged in.");
            }

            const response = await fetch(
                "https://vaultiq-xpyl.onrender.com/api/auth/change-password",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({
                        current_password: currentPassword,
                        new_password: newPassword,
                    }),
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.detail || "Failed to change password.");
            }

            setPasswordMessage("✓ Password changed successfully.");
            setCurrentPassword("");
            setNewPassword("");
            setConfirmPassword("");
        } catch (error) {
            setPasswordMessage(error.message || "Failed to change password.");
        } finally {
            setChangingPassword(false);
        }
    };

    const selectPlan = (planName) => {
        if (planName === "Free") {
            setSelectedPlan("Free");
            localStorage.setItem("vaultiq_plan", "Free");
            setSettingsMessage("✓ Free plan selected.");
            return;
        }

        // Payment gateway can be connected here later.
        alert(`You selected the ${planName} plan. Payment integration will be connected here.`);
    };

    // =========================================================
    // RENDER
    // =========================================================

    return (
        <div
            className="min-h-screen bg-slate-100 flex"
            onClick={() =>
                setOpenMenuId(null)
            }
        >

            {/* =====================================================
          SIDEBAR
      ===================================================== */}

            <aside className="w-64 bg-slate-900 text-white flex flex-col fixed left-0 top-0 bottom-0">

                <div className="px-6 py-6 border-b border-slate-700">

                    <div className="flex items-center gap-3">

                        <div className="w-11 h-11 rounded-xl bg-blue-600 flex items-center justify-center text-2xl shadow-lg">
                            ☁️
                        </div>

                        <div>

                            <h1 className="text-xl font-bold">
                                VaultIQ
                            </h1>

                            <p className="text-xs text-slate-400">
                                Cloud Storage
                            </p>

                        </div>

                    </div>

                </div>

                <nav className="flex-1 px-4 py-6">

                    <p className="text-xs uppercase tracking-wider text-slate-500 px-3 mb-3">
                        Storage
                    </p>

                    {/* MY DRIVE */}

                    <button
                        onClick={
                            handleGoHome
                        }
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition mb-2 ${activePage ===
                                "drive"
                                ? "bg-blue-600 text-white"
                                : "text-slate-300 hover:bg-slate-800"
                            }`}
                    >
                        <span>📁</span>
                        <span>My Drive</span>
                    </button>

                    {/* SHARED */}

                    <button
                        onClick={handleOpenShared}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition mb-2 ${activePage === "shared"
                                ? "bg-blue-600 text-white"
                                : "text-slate-300 hover:bg-slate-800"
                            }`}
                    >
                        <span>👥</span>
                        <span>Shared with me</span>

                        {receivedShares.length > 0 && (
                            <span className="ml-auto text-xs bg-slate-700 px-2 py-1 rounded-full">
                                {receivedShares.length}
                            </span>
                        )}
                    </button>

                    {/* STARRED */}

                    <button
                        onClick={
                            handleOpenStarred
                        }
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition mb-2 ${activePage ===
                                "starred"
                                ? "bg-blue-600 text-white"
                                : "text-slate-300 hover:bg-slate-800"
                            }`}
                    >
                        <span>⭐</span>
                        <span>Starred</span>

                        {starredItems.length >
                            0 && (
                                <span className="ml-auto text-xs bg-slate-700 px-2 py-1 rounded-full">
                                    {
                                        starredItems.length
                                    }
                                </span>
                            )}

                    </button>

                    {/* TRASH */}

                    <button
                        onClick={handleOpenTrash}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition ${activePage === "trash"
                                ? "bg-blue-600 text-white"
                                : "text-slate-300 hover:bg-slate-800"
                            }`}
                    >
                        <span>🗑️</span>
                        <span>Trash</span>

                        {trashFiles.length > 0 && (
                            <span className="ml-auto text-xs bg-slate-700 px-2 py-1 rounded-full">
                                {trashFiles.length}
                            </span>
                        )}
                    </button>

                    {/* STORAGE MANAGEMENT */}
                    <button
                        onClick={() => setActivePage("storage")}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition mb-2 ${activePage === "storage"
                                ? "bg-blue-600 text-white"
                                : "text-slate-300 hover:bg-slate-800"
                            }`}
                    >
                        <span>💾</span>
                        <span>Storage Management</span>
                    </button>

                    {/* SETTINGS */}
                    <button
                        onClick={() => setActivePage("settings")}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition ${activePage === "settings"
                                ? "bg-blue-600 text-white"
                                : "text-slate-300 hover:bg-slate-800"
                            }`}
                    >
                        <span>⚙️</span>
                        <span>Settings</span>
                    </button>

                </nav>

                {/* STORAGE */}

                <div className="px-5 pb-5">

                    <div className="bg-slate-800 rounded-2xl p-4">

                        <div className="flex items-center justify-between mb-2">

                            <span className="text-sm text-slate-300">
                                Storage
                            </span>

                            <span className="text-sm font-semibold">
                                {storagePercentage.toFixed(
                                    0
                                )}
                                %
                            </span>

                        </div>

                        <div className="w-full h-2 bg-slate-700 rounded-full overflow-hidden">

                            <div
                                className="h-full bg-blue-500 rounded-full transition-all"
                                style={{
                                    width: `${storagePercentage}%`,
                                }}
                            />

                        </div>

                        <p className="text-xs text-slate-400 mt-2">
                            {totalStorageMB.toFixed(
                                2
                            )}{" "}
                            MB of {currentPlan.limit >= 1024
                                ? `${(currentPlan.limit / 1024).toFixed(0)} TB`
                                : `${currentPlan.limit} GB`} used
                        </p>

                    </div>

                </div>

                {/* USER */}

                <div className="border-t border-slate-700 p-4">

                    <div className="flex items-center justify-between">

                        <div className="flex items-center gap-3">

                            <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center font-bold">
                                U
                            </div>

                            <div>

                                <p className="text-sm font-semibold">
                                    {displayName}
                                </p>

                                <p className="text-xs text-slate-400">
                                    My Account
                                </p>

                            </div>

                        </div>

                        <button
                            onClick={
                                handleLogout
                            }
                            className="text-slate-400 hover:text-red-400 transition"
                            title="Logout"
                        >
                            ↪
                        </button>

                    </div>

                </div>

            </aside>

            {/* =====================================================
          MAIN
      ===================================================== */}

            <main className="ml-64 flex-1 min-h-screen">

                {/* HEADER */}

                <header className="bg-white border-b border-slate-200 px-8 py-5">

                    <div className="flex items-center justify-between">

                        <div>

                            <h2 className="text-2xl font-bold text-slate-800">

                                {activePage === "starred"
                                    ? "Starred"
                                    : activePage === "trash"
                                        ? "Trash"
                                        : activePage === "shared"
                                            ? "Shared with me"
                                            : "My Drive"}

                            </h2>

                            <p className="text-sm text-slate-500 mt-1">

                                {activePage === "starred"
                                    ? "Your favorite files and folders"
                                    : activePage === "trash"
                                        ? "Restore or permanently delete your files"
                                        : activePage === "shared"
                                            ? "Files and folders shared with your account"
                                            : "Manage your files and folders"}

                            </p>

                        </div>

                        <div className="flex items-center gap-3">

                            {/* SEARCH */}

                            <div className="relative">

                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                                    🔍
                                </span>

                                <input
                                    type="text"
                                    value={searchTerm}
                                    onChange={(event) =>
                                        setSearchTerm(
                                            event.target.value
                                        )
                                    }
                                    placeholder={
                                        activePage === "starred"
                                            ? "Search starred..."
                                            : activePage === "trash"
                                                ? "Search trash..."
                                                : activePage === "shared"
                                                    ? "Search shared..."
                                                    : "Search files..."
                                    }
                                    className="w-64 pl-11 pr-10 py-3 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
                                />

                                {searchTerm && (

                                    <button
                                        onClick={() =>
                                            setSearchTerm(
                                                ""
                                            )
                                        }
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                                    >
                                        ✕
                                    </button>

                                )}

                            </div>

                            {/* ONLY SHOW NEW FOLDER / UPLOAD IN DRIVE */}

                            {activePage ===
                                "drive" && (

                                    <>
                                        <button
                                            onClick={() =>
                                                setShowFolderModal(
                                                    true
                                                )
                                            }
                                            className="px-5 py-3 rounded-xl font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200 transition"
                                        >
                                            📁 New Folder
                                        </button>

                                        <label
                                            htmlFor="file-upload"
                                            className={`px-5 py-3 rounded-xl font-semibold cursor-pointer transition shadow-sm ${uploading
                                                    ? "bg-slate-400 cursor-not-allowed text-white"
                                                    : "bg-blue-600 hover:bg-blue-700 text-white"
                                                }`}
                                        >
                                            {uploading
                                                ? "Uploading..."
                                                : "+ Upload"}
                                        </label>
                                    </>

                                )}

                        </div>

                    </div>

                </header>

                {/* FILE INPUT */}

                <input
                    id="file-upload"
                    type="file"
                    className="hidden"
                    onChange={
                        handleUpload
                    }
                    disabled={uploading}
                />

                <div className="p-8">

                    {/* UPLOAD MESSAGE */}

                    {uploadMessage &&
                        activePage ===
                        "drive" && (

                            <div
                                className={`mb-5 px-5 py-4 rounded-xl text-sm font-medium ${uploadMessage.startsWith(
                                    "✓"
                                )
                                        ? "bg-green-50 text-green-700 border border-green-200"
                                        : "bg-red-50 text-red-700 border border-red-200"
                                    }`}
                            >
                                {uploadMessage}
                            </div>

                        )}

                    {/* =================================================
              STARRED PAGE
          ================================================= */}

                    {activePage === "starred" ? (

                        <div>

                            <div className="relative overflow-hidden bg-gradient-to-r from-yellow-500 to-orange-500 rounded-3xl p-8 text-white mb-8">

                                <div className="absolute -right-10 -top-20 w-64 h-64 bg-white/10 rounded-full" />

                                <div className="relative z-10">

                                    <p className="text-yellow-100 text-sm mb-2">
                                        ⭐ Favorites
                                    </p>

                                    <h1 className="text-3xl font-bold mb-3">
                                        Your Starred Items
                                    </h1>

                                    <p className="text-yellow-100 max-w-xl">
                                        Quickly access the files and folders
                                        that matter most to you.
                                    </p>

                                </div>

                            </div>

                            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm">

                                <div className="px-7 py-5 border-b border-slate-200 flex items-center justify-between">

                                    <div>

                                        <h2 className="text-xl font-bold text-slate-800">
                                            Starred
                                        </h2>

                                        <p className="text-sm text-slate-500 mt-1">
                                            {
                                                filteredStarredItems.length
                                            }{" "}
                                            starred items
                                        </p>

                                    </div>

                                    <button
                                        onClick={
                                            fetchStarred
                                        }
                                        className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition"
                                    >
                                        ↻ Refresh
                                    </button>

                                </div>

                                <div className="p-7">

                                    {loadingStars ? (

                                        <div className="flex flex-col items-center justify-center py-20">

                                            <div className="w-10 h-10 border-4 border-yellow-200 border-t-yellow-500 rounded-full animate-spin mb-4" />

                                            <p className="text-slate-500">
                                                Loading starred items...
                                            </p>

                                        </div>

                                    ) : filteredStarredItems.length >
                                        0 ? (

                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">

                                            {filteredStarredItems.map(
                                                (star) => {

                                                    const file =
                                                        getStarredFile(
                                                            star
                                                        );

                                                    const folder =
                                                        getStarredFolder(
                                                            star
                                                        );

                                                    if (
                                                        !file &&
                                                        !folder
                                                    ) {
                                                        return null;
                                                    }

                                                    return (

                                                        <div
                                                            key={
                                                                star.id
                                                            }
                                                            onClick={() => {

                                                                if (
                                                                    file
                                                                ) {
                                                                    handleOpenFile(
                                                                        file
                                                                    );
                                                                }

                                                                if (
                                                                    folder
                                                                ) {
                                                                    handleOpenFolder(
                                                                        folder
                                                                    );
                                                                }

                                                            }}
                                                            className="group relative bg-slate-50 border border-slate-200 rounded-2xl p-5 hover:bg-white hover:border-yellow-300 hover:shadow-lg transition-all duration-200 cursor-pointer"
                                                        >

                                                            <div className="flex items-start justify-between mb-5">

                                                                <div className="w-14 h-14 bg-white rounded-xl flex items-center justify-center text-3xl shadow-sm">
                                                                    {file
                                                                        ? getFileIcon(
                                                                            file
                                                                        )
                                                                        : "📁"}
                                                                </div>

                                                                <button
                                                                    onClick={(
                                                                        event
                                                                    ) => {
                                                                        event.stopPropagation();
                                                                        handleUnstar(
                                                                            star
                                                                        );
                                                                    }}
                                                                    className="w-9 h-9 rounded-lg text-yellow-500 hover:bg-yellow-50 transition text-xl"
                                                                    title="Remove from starred"
                                                                >
                                                                    ⭐
                                                                </button>

                                                            </div>

                                                            <h3
                                                                className="font-semibold text-slate-800 truncate"
                                                                title={
                                                                    file?.name ||
                                                                    file?.original_name ||
                                                                    folder?.name
                                                                }
                                                            >
                                                                {file?.name ||
                                                                    file?.original_name ||
                                                                    folder?.name}
                                                            </h3>

                                                            {file ? (

                                                                <div className="flex items-center justify-between mt-2">

                                                                    <p className="text-xs text-slate-500">
                                                                        {formatFileSize(
                                                                            file.size
                                                                        )}
                                                                    </p>

                                                                    <p className="text-xs text-slate-400">
                                                                        File
                                                                    </p>

                                                                </div>

                                                            ) : (

                                                                <p className="text-xs text-slate-500 mt-2">
                                                                    Folder
                                                                </p>

                                                            )}

                                                        </div>

                                                    );
                                                }
                                            )}

                                        </div>

                                    ) : (

                                        <div className="flex flex-col items-center justify-center py-16">

                                            <div className="w-28 h-28 bg-yellow-50 rounded-full flex items-center justify-center text-5xl mb-5">
                                                ⭐
                                            </div>

                                            <h3 className="text-xl font-bold text-slate-800 mb-2">
                                                No starred items
                                            </h3>

                                            <p className="text-slate-500 text-center max-w-md">
                                                Star important files or folders
                                                to quickly find them here.
                                            </p>

                                        </div>

                                    )}

                                </div>

                            </div>

                        </div>

                    ) : activePage === "shared" ? (

                        /* =================================================
                           SHARED WITH ME PAGE
                        ================================================= */

                        <div>

                            <div className="relative overflow-hidden bg-gradient-to-r from-indigo-600 to-blue-600 rounded-3xl p-8 text-white mb-8">

                                <div className="absolute -right-10 -top-20 w-64 h-64 bg-white/10 rounded-full" />

                                <div className="relative z-10">

                                    <p className="text-indigo-100 text-sm mb-2">
                                        👥 Collaboration
                                    </p>

                                    <h1 className="text-3xl font-bold mb-3">
                                        Shared with Me
                                    </h1>

                                    <p className="text-indigo-100 max-w-xl">
                                        Files and folders that other users have shared with you.
                                    </p>

                                </div>

                            </div>

                            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm">

                                <div className="px-7 py-5 border-b border-slate-200 flex items-center justify-between">

                                    <div>
                                        <h2 className="text-xl font-bold text-slate-800">
                                            Shared with me
                                        </h2>
                                        <p className="text-sm text-slate-500 mt-1">
                                            {receivedShares.filter((share) => {
                                                const target = share.file_id || share.folder_id || "";
                                                return target.toLowerCase().includes(searchTerm.toLowerCase());
                                            }).length} shared items
                                        </p>
                                    </div>

                                    <button
                                        onClick={fetchReceivedShares}
                                        className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition"
                                    >
                                        ↻ Refresh
                                    </button>

                                </div>

                                <div className="p-7">

                                    {loadingShares ? (

                                        <div className="flex flex-col items-center justify-center py-20">
                                            <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mb-4" />
                                            <p className="text-slate-500">Loading shared items...</p>
                                        </div>

                                    ) : receivedShares.filter((share) => {
                                        const target = share.file_id || share.folder_id || "";
                                        return target.toLowerCase().includes(searchTerm.toLowerCase());
                                    }).length > 0 ? (

                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">

                                            {receivedShares
                                                .filter((share) => {
                                                    const target = share.file_id || share.folder_id || "";
                                                    return target.toLowerCase().includes(searchTerm.toLowerCase());
                                                })
                                                .map((share) => {
                                                    const isFile = Boolean(share.file_id);
                                                    const targetId = share.file_id || share.folder_id;

                                                    return (
                                                        <div
                                                            key={share.id}
                                                            className="bg-slate-50 border border-slate-200 rounded-2xl p-5 hover:bg-white hover:border-blue-300 hover:shadow-lg transition"
                                                        >

                                                            <div className="flex items-start justify-between mb-5">

                                                                <div className="w-14 h-14 bg-white rounded-xl flex items-center justify-center text-3xl shadow-sm">
                                                                    {isFile ? "📄" : "📁"}
                                                                </div>

                                                                <span className={`text-xs px-2 py-1 rounded-full font-semibold ${share.permission === "EDITOR"
                                                                        ? "bg-purple-50 text-purple-600"
                                                                        : "bg-blue-50 text-blue-600"
                                                                    }`}>
                                                                    {share.permission === "EDITOR" ? "Editor" : "Viewer"}
                                                                </span>

                                                            </div>

                                                            <h3 className="font-semibold text-slate-800 truncate">
                                                                {isFile ? "Shared File" : "Shared Folder"}
                                                            </h3>

                                                            <p className="text-xs text-slate-500 mt-2 break-all">
                                                                ID: {targetId}
                                                            </p>

                                                            <p className="text-xs text-slate-400 mt-2">
                                                                Shared on {
                                                                    share.created_at
                                                                        ? new Date(share.created_at).toLocaleDateString()
                                                                        : "—"
                                                                }
                                                            </p>

                                                            <div className="mt-5 px-3 py-2 rounded-lg bg-amber-50 border border-amber-100 text-xs text-amber-700">
                                                                Shared access is being connected in the next step.
                                                            </div>

                                                        </div>
                                                    );
                                                })}

                                        </div>

                                    ) : (

                                        <div className="flex flex-col items-center justify-center py-16">
                                            <div className="w-28 h-28 bg-blue-50 rounded-full flex items-center justify-center text-5xl mb-5">
                                                👥
                                            </div>
                                            <h3 className="text-xl font-bold text-slate-800 mb-2">
                                                {searchTerm ? "No results found" : "Nothing shared with you"}
                                            </h3>
                                            <p className="text-slate-500 text-center max-w-md">
                                                {searchTerm
                                                    ? `No shared items match "${searchTerm}".`
                                                    : "Files and folders shared with your account will appear here."}
                                            </p>
                                        </div>

                                    )}

                                </div>

                            </div>

                            {/* MY RECENT SHARES */}

                            {sentShares.length > 0 && (
                                <div className="bg-white rounded-3xl border border-slate-200 shadow-sm mt-8">

                                    <div className="px-7 py-5 border-b border-slate-200">
                                        <h2 className="text-xl font-bold text-slate-800">
                                            Recent Shares
                                        </h2>
                                        <p className="text-sm text-slate-500 mt-1">
                                            Shares created during this session
                                        </p>
                                    </div>

                                    <div className="p-7 space-y-3">
                                        {sentShares.map((share) => (
                                            <div
                                                key={share.id}
                                                className="flex flex-col md:flex-row md:items-center gap-4 p-4 bg-slate-50 rounded-xl border border-slate-200"
                                            >
                                                <div className="flex-1">
                                                    <p className="font-semibold text-slate-800">
                                                        {share.target_name || (share.file_id ? "Shared File" : "Shared Folder")}
                                                    </p>
                                                    <p className="text-xs text-slate-500 mt-1 break-all">
                                                        Shared with: {share.shared_with_user_id}
                                                    </p>
                                                </div>

                                                <select
                                                    value={share.permission}
                                                    onChange={(event) =>
                                                        handleUpdateShare(share.id, event.target.value)
                                                    }
                                                    className="px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
                                                >
                                                    <option value="VIEWER">Viewer</option>
                                                    <option value="EDITOR">Editor</option>
                                                </select>

                                                <button
                                                    onClick={() => handleRemoveShare(share)}
                                                    className="px-4 py-2 rounded-lg bg-red-50 text-red-600 text-sm font-semibold hover:bg-red-100"
                                                >
                                                    Remove
                                                </button>
                                            </div>
                                        ))}
                                    </div>

                                </div>
                            )}

                        </div>

                    ) : activePage === "trash" ? (

                        /* =================================================
                           TRASH PAGE
                        ================================================= */

                        <div>

                            <div className="relative overflow-hidden bg-gradient-to-r from-slate-700 to-slate-900 rounded-3xl p-8 text-white mb-8">

                                <div className="absolute -right-10 -top-20 w-64 h-64 bg-white/10 rounded-full" />

                                <div className="relative z-10">

                                    <p className="text-slate-300 text-sm mb-2">
                                        🗑️ Recycle Bin
                                    </p>

                                    <h1 className="text-3xl font-bold mb-3">
                                        Your Trash
                                    </h1>

                                    <p className="text-slate-300 max-w-xl">
                                        Deleted files stay here until you restore
                                        them or permanently remove them.
                                    </p>

                                </div>

                            </div>

                            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm">

                                <div className="px-7 py-5 border-b border-slate-200 flex items-center justify-between">

                                    <div>

                                        <h2 className="text-xl font-bold text-slate-800">
                                            Deleted Files
                                        </h2>

                                        <p className="text-sm text-slate-500 mt-1">
                                            {filteredTrashFiles.length} deleted files
                                        </p>

                                    </div>

                                    <button
                                        onClick={fetchTrash}
                                        className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition"
                                    >
                                        ↻ Refresh
                                    </button>

                                </div>

                                <div className="p-7">

                                    {loadingTrash ? (

                                        <div className="flex flex-col items-center justify-center py-20">

                                            <div className="w-10 h-10 border-4 border-slate-200 border-t-slate-700 rounded-full animate-spin mb-4" />

                                            <p className="text-slate-500">
                                                Loading trash...
                                            </p>

                                        </div>

                                    ) : filteredTrashFiles.length > 0 ? (

                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">

                                            {filteredTrashFiles.map((file) => (

                                                <div
                                                    key={file.id}
                                                    className="bg-slate-50 border border-slate-200 rounded-2xl p-5 hover:bg-white hover:shadow-lg transition"
                                                >

                                                    <div className="flex items-start justify-between mb-5">

                                                        <div className="w-14 h-14 bg-white rounded-xl flex items-center justify-center text-3xl shadow-sm">
                                                            {getFileIcon(file)}
                                                        </div>

                                                        <span className="text-xs bg-red-50 text-red-600 px-2 py-1 rounded-full">
                                                            Deleted
                                                        </span>

                                                    </div>

                                                    <h3
                                                        className="font-semibold text-slate-800 truncate"
                                                        title={
                                                            file.name ||
                                                            file.original_name
                                                        }
                                                    >
                                                        {file.name ||
                                                            file.original_name}
                                                    </h3>

                                                    <div className="flex items-center justify-between mt-2">

                                                        <p className="text-xs text-slate-500">
                                                            {formatFileSize(file.size)}
                                                        </p>

                                                        <p className="text-xs text-slate-400">
                                                            {file.mime_type
                                                                ? file.mime_type
                                                                    .split("/")
                                                                    .pop()
                                                                : "File"}
                                                        </p>

                                                    </div>

                                                    <div className="flex gap-2 mt-5">

                                                        <button
                                                            onClick={() =>
                                                                handleRestoreFile(file)
                                                            }
                                                            className="flex-1 px-3 py-2 rounded-lg bg-green-50 text-green-700 text-sm font-semibold hover:bg-green-100 transition"
                                                        >
                                                            ♻️ Restore
                                                        </button>

                                                        <button
                                                            onClick={() =>
                                                                handlePermanentDelete(file)
                                                            }
                                                            className="flex-1 px-3 py-2 rounded-lg bg-red-50 text-red-600 text-sm font-semibold hover:bg-red-100 transition"
                                                        >
                                                            Delete
                                                        </button>

                                                    </div>

                                                </div>

                                            ))}

                                        </div>

                                    ) : (

                                        <div className="flex flex-col items-center justify-center py-16">

                                            <div className="w-28 h-28 bg-slate-100 rounded-full flex items-center justify-center text-5xl mb-5">
                                                🗑️
                                            </div>

                                            <h3 className="text-xl font-bold text-slate-800 mb-2">
                                                {searchTerm
                                                    ? "No results found"
                                                    : "Trash is empty"}
                                            </h3>

                                            <p className="text-slate-500 text-center max-w-md">
                                                {searchTerm
                                                    ? `No deleted files match "${searchTerm}".`
                                                    : "Deleted files will appear here."}
                                            </p>

                                        </div>

                                    )}

                                </div>

                            </div>

                        </div>

                    ) : activePage === "storage" ? (

                        <div>
                            <div className="relative overflow-hidden bg-gradient-to-r from-blue-600 to-indigo-700 rounded-3xl p-8 text-white mb-8">
                                <div className="relative z-10">
                                    <p className="text-blue-100 text-sm mb-2">💾 Storage Management</p>
                                    <h1 className="text-3xl font-bold mb-3">Manage your storage</h1>
                                    <p className="text-blue-100 max-w-2xl">Check your usage and choose a larger plan whenever you need more space.</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                                <div className="lg:col-span-1 bg-white rounded-3xl border border-slate-200 shadow-sm p-7">
                                    <div className="flex items-center justify-between mb-5">
                                        <h2 className="text-xl font-bold text-slate-800">Storage Usage</h2>
                                        <span className="px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-sm font-semibold">{storageUsage.plan}</span>
                                    </div>
                                    <div className="w-full h-4 bg-slate-100 rounded-full overflow-hidden mb-4">
                                        <div className="h-full bg-blue-600 rounded-full" style={{ width: `${storagePercentage}%` }} />
                                    </div>
                                    <p className="text-2xl font-bold text-slate-800">{totalStorageMB.toFixed(2)} MB</p>
                                    <p className="text-sm text-slate-500 mt-1">of {currentPlan.limit >= 1024 ? `${currentPlan.limit / 1024} TB` : `${currentPlan.limit} GB`} used</p>
                                    <p className="text-sm text-slate-500 mt-4">{storagePercentage.toFixed(1)}% of your storage is currently used.</p>
                                </div>

                                <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200 shadow-sm p-7">
                                    <h2 className="text-xl font-bold text-slate-800 mb-2">Upgrade Storage</h2>
                                    <p className="text-slate-500 mb-6">Choose a plan that fits your storage needs.</p>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        {Object.entries(storagePlans).filter(([name]) => name !== "Free").map(([name, plan]) => (
                                            <div key={name} className={`rounded-2xl border p-5 ${selectedPlan === name ? "border-blue-500 ring-2 ring-blue-100" : "border-slate-200"}`}>
                                                <h3 className="font-bold text-lg text-slate-800">{name}</h3>
                                                <p className="text-2xl font-bold text-blue-600 mt-2">₹{plan.price}<span className="text-sm text-slate-400 font-normal">/month</span></p>
                                                <p className="text-sm text-slate-500 mt-1">{plan.limit >= 1024 ? "1 TB" : `${plan.limit} GB`} storage</p>
                                                <button onClick={() => selectPlan(name)} className="w-full mt-5 px-4 py-3 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 transition">
                                                    {selectedPlan === name ? "Current Plan" : "Upgrade"}
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                    <p className="text-xs text-slate-400 mt-5">Paid plans are shown here for now. Payment and plan activation will be connected later.</p>
                                </div>
                            </div>
                        </div>

                    ) : activePage === "settings" ? (

                        <div>
                            <div className="relative overflow-hidden bg-gradient-to-r from-slate-800 to-slate-950 rounded-3xl p-8 text-white mb-8">
                                <p className="text-slate-300 text-sm mb-2">⚙️ Account Settings</p>
                                <h1 className="text-3xl font-bold mb-3">Settings</h1>
                                <p className="text-slate-300">Manage your profile and VaultIQ preferences.</p>
                            </div>

                            <div className="max-w-3xl space-y-6">
                                <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-7">
                                    <h2 className="text-xl font-bold text-slate-800">Profile</h2>
                                    <p className="text-sm text-slate-500 mt-1 mb-6">Update the name displayed in your dashboard.</p>
                                    <label className="block text-sm font-semibold text-slate-700 mb-2">Display Name</label>
                                    <input value={displayName} onChange={(e) => setDisplayName(e.target.value)} className="w-full px-4 py-3 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500" />
                                    <button onClick={saveSettings} className="mt-4 px-5 py-3 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700">Save Changes</button>
                                    {settingsMessage && <p className="mt-3 text-sm text-green-600">{settingsMessage}</p>}
                                </div>

                                <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-7">
                                    <h2 className="text-xl font-bold text-slate-800">Change Password</h2>
                                    <p className="text-sm text-slate-500 mt-1 mb-6">Update your VaultIQ account password.</p>

                                    <form onSubmit={handleChangePassword}>
                                        <div className="mb-4">
                                            <label className="block text-sm font-semibold text-slate-700 mb-2">Current Password</label>
                                            <input
                                                type="password"
                                                value={currentPassword}
                                                onChange={(event) => setCurrentPassword(event.target.value)}
                                                placeholder="Enter current password"
                                                className="w-full px-4 py-3 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
                                            />
                                        </div>

                                        <div className="mb-4">
                                            <label className="block text-sm font-semibold text-slate-700 mb-2">New Password</label>
                                            <input
                                                type="password"
                                                value={newPassword}
                                                onChange={(event) => setNewPassword(event.target.value)}
                                                placeholder="Enter new password"
                                                className="w-full px-4 py-3 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
                                            />
                                            <p className="text-xs text-slate-400 mt-2">Password must contain at least 8 characters.</p>
                                        </div>

                                        <div className="mb-5">
                                            <label className="block text-sm font-semibold text-slate-700 mb-2">Confirm New Password</label>
                                            <input
                                                type="password"
                                                value={confirmPassword}
                                                onChange={(event) => setConfirmPassword(event.target.value)}
                                                placeholder="Confirm new password"
                                                className="w-full px-4 py-3 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
                                            />
                                        </div>

                                        <button
                                            type="submit"
                                            disabled={changingPassword}
                                            className="px-5 py-3 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 disabled:bg-slate-400 transition"
                                        >
                                            {changingPassword ? "Changing Password..." : "Change Password"}
                                        </button>

                                        {passwordMessage && (
                                            <p className={`mt-4 text-sm ${passwordMessage.startsWith("✓") ? "text-green-600" : "text-red-600"}`}>
                                                {passwordMessage}
                                            </p>
                                        )}
                                    </form>
                                </div>

                                <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-7">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <h2 className="text-xl font-bold text-slate-800">Current Plan</h2>
                                            <p className="text-sm text-slate-500 mt-1">{selectedPlan} · {currentPlan.limit >= 1024 ? "1 TB" : `${currentPlan.limit} GB`} storage</p>
                                        </div>
                                        <button onClick={() => setActivePage("storage")} className="px-5 py-3 rounded-xl bg-slate-900 text-white font-semibold hover:bg-slate-800">Manage Plan</button>
                                    </div>
                                </div>
                            </div>
                        </div>

                    ) : (

                        /* =================================================
                           MY DRIVE PAGE
                        ================================================= */

                        <>

                            {/* WELCOME BANNER */}

                            <div className="relative overflow-hidden bg-gradient-to-r from-blue-600 to-indigo-600 rounded-3xl p-8 text-white mb-8">

                                <div className="absolute -right-10 -top-20 w-64 h-64 bg-white/10 rounded-full" />

                                <div className="absolute right-32 -bottom-24 w-72 h-72 bg-white/10 rounded-full" />

                                <div className="relative z-10 flex items-center justify-between">

                                    <div>

                                        <p className="text-blue-100 text-sm mb-2">
                                            Welcome back 👋
                                        </p>

                                        <h1 className="text-3xl font-bold mb-3">
                                            Your files. Your space.
                                        </h1>

                                        <p className="text-blue-100 max-w-xl">
                                            Store, manage and access your
                                            files securely from anywhere.
                                        </p>

                                        <div className="flex gap-3 mt-5">

                                            <label
                                                htmlFor="file-upload"
                                                className="inline-block px-5 py-3 bg-white text-blue-600 font-semibold rounded-xl cursor-pointer hover:bg-blue-50 transition"
                                            >
                                                Upload a File
                                            </label>

                                            <button
                                                onClick={() =>
                                                    setShowFolderModal(
                                                        true
                                                    )
                                                }
                                                className="px-5 py-3 bg-white/15 border border-white/30 text-white font-semibold rounded-xl hover:bg-white/20 transition"
                                            >
                                                📁 New Folder
                                            </button>

                                        </div>

                                    </div>

                                    <div className="hidden lg:flex w-40 h-40 bg-white/10 rounded-full items-center justify-center text-7xl">
                                        ☁️
                                    </div>

                                </div>

                            </div>

                            {/* BREADCRUMBS */}

                            <div className="bg-white rounded-2xl border border-slate-200 px-6 py-4 mb-6">

                                <div className="flex items-center gap-2 flex-wrap">

                                    {breadcrumbs.map(
                                        (
                                            breadcrumb,
                                            index
                                        ) => (

                                            <div
                                                key={`${breadcrumb.id}-${index}`}
                                                className="flex items-center gap-2"
                                            >

                                                <button
                                                    onClick={() =>
                                                        handleBreadcrumbClick(
                                                            index
                                                        )
                                                    }
                                                    className={`flex items-center gap-2 px-3 py-2 rounded-lg transition ${index ===
                                                            breadcrumbs.length -
                                                            1
                                                            ? "bg-blue-50 text-blue-600 font-semibold"
                                                            : "text-slate-500 hover:bg-slate-100"
                                                        }`}
                                                >
                                                    {index ===
                                                        0
                                                        ? "🏠"
                                                        : "📁"}

                                                    {
                                                        breadcrumb.name
                                                    }

                                                </button>

                                                {index <
                                                    breadcrumbs.length -
                                                    1 && (
                                                        <span className="text-slate-400">
                                                            /
                                                        </span>
                                                    )}

                                            </div>

                                        )
                                    )}

                                </div>

                            </div>

                            {/* STAT CARDS */}

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">

                                <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">

                                    <div className="flex items-center justify-between">

                                        <div>

                                            <p className="text-sm text-slate-500 mb-2">
                                                Files Here
                                            </p>

                                            <h3 className="text-3xl font-bold text-slate-800">
                                                {
                                                    filteredFiles.length
                                                }
                                            </h3>

                                        </div>

                                        <div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center text-2xl">
                                            📄
                                        </div>

                                    </div>

                                </div>

                                <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">

                                    <div className="flex items-center justify-between">

                                        <div>

                                            <p className="text-sm text-slate-500 mb-2">
                                                Storage Used
                                            </p>

                                            <h3 className="text-3xl font-bold text-slate-800">
                                                {totalStorageMB.toFixed(
                                                    2
                                                )}{" "}
                                                MB
                                            </h3>

                                        </div>

                                        <div className="w-14 h-14 rounded-2xl bg-indigo-50 flex items-center justify-center text-2xl">
                                            💾
                                        </div>

                                    </div>

                                </div>

                                <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">

                                    <div className="flex items-center justify-between">

                                        <div>

                                            <p className="text-sm text-slate-500 mb-2">
                                                Folders
                                            </p>

                                            <h3 className="text-3xl font-bold text-slate-800">
                                                {
                                                    filteredFolders.length
                                                }
                                            </h3>

                                        </div>

                                        <div className="w-14 h-14 rounded-2xl bg-purple-50 flex items-center justify-center text-2xl">
                                            📂
                                        </div>

                                    </div>

                                </div>

                            </div>

                            {/* FILE AREA */}

                            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm">

                                <div className="px-7 py-5 border-b border-slate-200 flex items-center justify-between">

                                    <div>

                                        <h2 className="text-xl font-bold text-slate-800">
                                            {
                                                breadcrumbs[
                                                    breadcrumbs.length -
                                                    1
                                                ].name
                                            }
                                        </h2>

                                        <p className="text-sm text-slate-500 mt-1">
                                            {
                                                filteredFolders.length
                                            }{" "}
                                            folders ·{" "}
                                            {
                                                filteredFiles.length
                                            }{" "}
                                            files
                                        </p>

                                    </div>

                                    <button
                                        onClick={
                                            handleRefresh
                                        }
                                        className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition"
                                    >
                                        ↻ Refresh
                                    </button>

                                </div>

                                <div className="p-7">

                                    {loadingFiles ||
                                        loadingFolders ? (

                                        <div className="flex flex-col items-center justify-center py-20">

                                            <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mb-4" />

                                            <p className="text-slate-500">
                                                Loading your files...
                                            </p>

                                        </div>

                                    ) : (

                                        <div>

                                            {/* FOLDERS */}

                                            {filteredFolders.length >
                                                0 && (

                                                    <div className="mb-8">

                                                        <h3 className="text-sm font-semibold text-slate-500 mb-4">
                                                            Folders
                                                        </h3>

                                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">

                                                            {filteredFolders.map(
                                                                (
                                                                    folder
                                                                ) => (

                                                                    <div
                                                                        key={
                                                                            folder.id
                                                                        }
                                                                        onClick={() =>
                                                                            handleOpenFolder(
                                                                                folder
                                                                            )
                                                                        }
                                                                        className="group relative bg-slate-50 border border-slate-200 rounded-2xl p-5 hover:bg-white hover:border-blue-300 hover:shadow-lg transition-all duration-200 cursor-pointer"
                                                                    >

                                                                        <div className="flex items-center justify-between mb-5">

                                                                            <div className="w-14 h-14 bg-blue-50 rounded-xl flex items-center justify-center text-3xl">
                                                                                📁
                                                                            </div>

                                                                            <div className="flex items-center gap-1">

                                                                                {/* STAR */}

                                                                                <button
                                                                                    onClick={(
                                                                                        event
                                                                                    ) => {
                                                                                        event.stopPropagation();

                                                                                        handleStarFolder(
                                                                                            folder
                                                                                        );
                                                                                    }}
                                                                                    className={`w-9 h-9 rounded-lg transition text-lg ${isFolderStarred(
                                                                                        folder.id
                                                                                    )
                                                                                            ? "text-yellow-500 bg-yellow-50"
                                                                                            : "text-slate-300 hover:text-yellow-500 hover:bg-yellow-50"
                                                                                        }`}
                                                                                    title={
                                                                                        isFolderStarred(
                                                                                            folder.id
                                                                                        )
                                                                                            ? "Remove star"
                                                                                            : "Star folder"
                                                                                    }
                                                                                >
                                                                                    ⭐
                                                                                </button>

                                                                                {/* SHARE */}

                                                                                <button
                                                                                    onClick={(event) => {
                                                                                        event.stopPropagation();
                                                                                        openShareModal(folder, "folder");
                                                                                    }}
                                                                                    className="w-9 h-9 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition text-lg"
                                                                                    title="Share folder"
                                                                                >
                                                                                    🔗
                                                                                </button>


                                                                                {/* MENU */}

                                                                                <div className="relative">

                                                                                    <button
                                                                                        onClick={(
                                                                                            event
                                                                                        ) => {
                                                                                            event.stopPropagation();

                                                                                            setOpenMenuId(
                                                                                                openMenuId ===
                                                                                                    folder.id
                                                                                                    ? null
                                                                                                    : folder.id
                                                                                            );
                                                                                        }}
                                                                                        className="w-9 h-9 rounded-lg text-slate-400 hover:bg-slate-200 hover:text-slate-700 transition text-xl"
                                                                                    >
                                                                                        ⋮
                                                                                    </button>

                                                                                    {openMenuId ===
                                                                                        folder.id && (

                                                                                            <div
                                                                                                onClick={(
                                                                                                    event
                                                                                                ) =>
                                                                                                    event.stopPropagation()
                                                                                                }
                                                                                                className="absolute right-0 top-10 w-36 bg-white border border-slate-200 rounded-xl shadow-xl z-20 overflow-hidden"
                                                                                            >

                                                                                                <button
                                                                                                    onClick={() =>
                                                                                                        openRenameModal(
                                                                                                            folder,
                                                                                                            "folder"
                                                                                                        )
                                                                                                    }
                                                                                                    className="w-full text-left px-4 py-3 text-sm text-slate-700 hover:bg-slate-50"
                                                                                                >
                                                                                                    ✏️ Rename
                                                                                                </button>

                                                                                                <button
                                                                                                    onClick={() =>
                                                                                                        openShareModal(
                                                                                                            folder,
                                                                                                            "folder"
                                                                                                        )
                                                                                                    }
                                                                                                    className="w-full text-left px-4 py-3 text-sm text-slate-700 hover:bg-slate-50"
                                                                                                >
                                                                                                    🔗 Share
                                                                                                </button>

                                                                                                <button
                                                                                                    onClick={() =>
                                                                                                        handleDeleteFolder(
                                                                                                            folder
                                                                                                        )
                                                                                                    }
                                                                                                    className="w-full text-left px-4 py-3 text-sm text-red-600 hover:bg-red-50"
                                                                                                >
                                                                                                    🗑️ Delete
                                                                                                </button>

                                                                                            </div>

                                                                                        )}

                                                                                </div>

                                                                            </div>

                                                                        </div>

                                                                        <h3
                                                                            className="font-semibold text-slate-800 truncate"
                                                                            title={
                                                                                folder.name
                                                                            }
                                                                        >
                                                                            {
                                                                                folder.name
                                                                            }
                                                                        </h3>

                                                                        <p className="text-xs text-slate-500 mt-2">
                                                                            Folder
                                                                        </p>

                                                                    </div>

                                                                )
                                                            )}

                                                        </div>

                                                    </div>

                                                )}

                                            {/* FILES */}

                                            {filteredFiles.length >
                                                0 && (

                                                    <div>

                                                        <h3 className="text-sm font-semibold text-slate-500 mb-4">
                                                            Files
                                                        </h3>

                                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">

                                                            {filteredFiles.map(
                                                                (
                                                                    file
                                                                ) => (

                                                                    <div
                                                                        key={
                                                                            file.id
                                                                        }
                                                                        onClick={() =>
                                                                            handleOpenFile(
                                                                                file
                                                                            )
                                                                        }
                                                                        className="group relative bg-slate-50 border border-slate-200 rounded-2xl p-5 hover:bg-white hover:border-blue-300 hover:shadow-lg transition-all duration-200 cursor-pointer"
                                                                    >

                                                                        <div className="flex items-start justify-between mb-5">

                                                                            <div className="w-14 h-14 bg-white rounded-xl flex items-center justify-center text-3xl shadow-sm">
                                                                                {getFileIcon(
                                                                                    file
                                                                                )}
                                                                            </div>

                                                                            <div className="flex items-center gap-1">

                                                                                {/* STAR */}

                                                                                <button
                                                                                    onClick={(
                                                                                        event
                                                                                    ) => {
                                                                                        event.stopPropagation();

                                                                                        handleStarFile(
                                                                                            file
                                                                                        );
                                                                                    }}
                                                                                    className={`w-9 h-9 rounded-lg transition text-lg ${isFileStarred(
                                                                                        file.id
                                                                                    )
                                                                                            ? "text-yellow-500 bg-yellow-50"
                                                                                            : "text-slate-300 hover:text-yellow-500 hover:bg-yellow-50"
                                                                                        }`}
                                                                                    title={
                                                                                        isFileStarred(
                                                                                            file.id
                                                                                        )
                                                                                            ? "Remove star"
                                                                                            : "Star file"
                                                                                    }
                                                                                >
                                                                                    ⭐
                                                                                </button>

                                                                                {/* SHARE */}

                                                                                <button
                                                                                    onClick={(event) => {
                                                                                        event.stopPropagation();
                                                                                        openShareModal(file, "file");
                                                                                    }}
                                                                                    className="w-9 h-9 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition text-lg"
                                                                                    title="Share file"
                                                                                >
                                                                                    🔗
                                                                                </button>

                                                                                {/* MENU */}

                                                                                <div className="relative">

                                                                                    <button
                                                                                        onClick={(
                                                                                            event
                                                                                        ) => {
                                                                                            event.stopPropagation();

                                                                                            setOpenMenuId(
                                                                                                openMenuId ===
                                                                                                    file.id
                                                                                                    ? null
                                                                                                    : file.id
                                                                                            );
                                                                                        }}
                                                                                        className="w-9 h-9 rounded-lg text-slate-400 hover:bg-slate-200 hover:text-slate-700 transition text-xl"
                                                                                    >
                                                                                        ⋮
                                                                                    </button>

                                                                                    {openMenuId ===
                                                                                        file.id && (

                                                                                            <div
                                                                                                onClick={(
                                                                                                    event
                                                                                                ) =>
                                                                                                    event.stopPropagation()
                                                                                                }
                                                                                                className="absolute right-0 top-10 w-36 bg-white border border-slate-200 rounded-xl shadow-xl z-20 overflow-hidden"
                                                                                            >

                                                                                                <button
                                                                                                    onClick={() =>
                                                                                                        openRenameModal(
                                                                                                            file,
                                                                                                            "file"
                                                                                                        )
                                                                                                    }
                                                                                                    className="w-full text-left px-4 py-3 text-sm text-slate-700 hover:bg-slate-50"
                                                                                                >
                                                                                                    ✏️ Rename
                                                                                                </button>

                                                                                                <button
                                                                                                    onClick={() =>
                                                                                                        openShareModal(
                                                                                                            file,
                                                                                                            "file"
                                                                                                        )
                                                                                                    }
                                                                                                    className="w-full text-left px-4 py-3 text-sm text-slate-700 hover:bg-slate-50"
                                                                                                >
                                                                                                    🔗 Share
                                                                                                </button>

                                                                                                <button
                                                                                                    onClick={() =>
                                                                                                        handleDeleteFile(
                                                                                                            file
                                                                                                        )
                                                                                                    }
                                                                                                    className="w-full text-left px-4 py-3 text-sm text-red-600 hover:bg-red-50"
                                                                                                >
                                                                                                    🗑️ Delete
                                                                                                </button>

                                                                                            </div>

                                                                                        )}

                                                                                </div>

                                                                            </div>

                                                                        </div>

                                                                        <h3
                                                                            className="font-semibold text-slate-800 truncate"
                                                                            title={
                                                                                file.name ||
                                                                                file.original_name
                                                                            }
                                                                        >
                                                                            {file.name ||
                                                                                file.original_name}
                                                                        </h3>

                                                                        <div className="flex items-center justify-between mt-2">

                                                                            <p className="text-xs text-slate-500">
                                                                                {formatFileSize(
                                                                                    file.size
                                                                                )}
                                                                            </p>

                                                                            <p className="text-xs text-slate-400">
                                                                                {file.mime_type
                                                                                    ? file.mime_type
                                                                                        .split(
                                                                                            "/"
                                                                                        )
                                                                                        .pop()
                                                                                    : "File"}
                                                                            </p>

                                                                        </div>

                                                                    </div>

                                                                )
                                                            )}

                                                        </div>

                                                    </div>

                                                )}

                                            {/* EMPTY */}

                                            {filteredFolders.length ===
                                                0 &&
                                                filteredFiles.length ===
                                                0 && (

                                                    <div className="flex flex-col items-center justify-center py-16">

                                                        <div className="w-28 h-28 bg-blue-50 rounded-full flex items-center justify-center text-5xl mb-5">
                                                            {searchTerm
                                                                ? "🔍"
                                                                : "📂"}
                                                        </div>

                                                        <h3 className="text-xl font-bold text-slate-800 mb-2">

                                                            {searchTerm
                                                                ? "No results found"
                                                                : "This folder is empty"}

                                                        </h3>

                                                        <p className="text-slate-500 text-center max-w-md mb-6">

                                                            {searchTerm
                                                                ? `No files or folders match "${searchTerm}".`
                                                                : "Create a folder or upload a file here."}

                                                        </p>

                                                        {!searchTerm && (

                                                            <div className="flex gap-3">

                                                                <button
                                                                    onClick={() =>
                                                                        setShowFolderModal(
                                                                            true
                                                                        )
                                                                    }
                                                                    className="px-5 py-3 bg-slate-100 text-slate-700 font-semibold rounded-xl hover:bg-slate-200"
                                                                >
                                                                    📁 New Folder
                                                                </button>

                                                                <label
                                                                    htmlFor="file-upload"
                                                                    className="px-5 py-3 bg-blue-600 text-white font-semibold rounded-xl cursor-pointer hover:bg-blue-700"
                                                                >
                                                                    Upload File
                                                                </label>

                                                            </div>

                                                        )}

                                                    </div>

                                                )}

                                        </div>

                                    )}

                                </div>

                            </div>

                        </>

                    )}

                    {/* INFO CARDS */}

                    {activePage ===
                        "drive" && (

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">

                                <div className="bg-white rounded-2xl border border-slate-200 p-6">

                                    <div className="flex items-start gap-4">

                                        <div className="w-12 h-12 rounded-xl bg-green-50 flex items-center justify-center text-2xl">
                                            🔒
                                        </div>

                                        <div>

                                            <h3 className="font-bold text-slate-800 mb-1">
                                                Secure Storage
                                            </h3>

                                            <p className="text-sm text-slate-500">
                                                Your files are securely stored
                                                with authenticated access.
                                            </p>

                                        </div>

                                    </div>

                                </div>

                                <div className="bg-white rounded-2xl border border-slate-200 p-6">

                                    <div className="flex items-start gap-4">

                                        <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-2xl">
                                            🌐
                                        </div>

                                        <div>

                                            <h3 className="font-bold text-slate-800 mb-1">
                                                Access Anywhere
                                            </h3>

                                            <p className="text-sm text-slate-500">
                                                Access your files whenever you
                                                need them from your cloud dashboard.
                                            </p>

                                        </div>

                                    </div>

                                </div>

                            </div>

                        )}

                </div>

            </main>

            {/* =====================================================
          SHARE MODAL
      ===================================================== */}

            {showShareModal && (

                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">

                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">

                        <div className="flex items-center justify-between mb-6">

                            <div>
                                <h2 className="text-xl font-bold text-slate-800">
                                    Share {shareTargetType === "file" ? "File" : "Folder"}
                                </h2>
                                <p className="text-sm text-slate-500 mt-1 truncate max-w-xs">
                                    {shareTarget?.name || shareTarget?.original_name || "Selected item"}
                                </p>
                            </div>

                            <button
                                onClick={closeShareModal}
                                className="text-slate-400 hover:text-slate-700 text-xl"
                            >
                                ✕
                            </button>

                        </div>

                        <form onSubmit={handleCreateShare}>

                            <label className="block text-sm font-semibold text-slate-700 mb-2">
                                Recipient User ID
                            </label>

                            <input
                                type="text"
                                value={recipientUserId}
                                onChange={(event) => setRecipientUserId(event.target.value)}
                                placeholder="Enter the user's UUID"
                                autoFocus
                                className="w-full px-4 py-3 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
                            />

                            <p className="text-xs text-slate-400 mt-2">
                                The recipient must already have an account in VaultIQ.
                            </p>

                            <label className="block text-sm font-semibold text-slate-700 mt-5 mb-2">
                                Permission
                            </label>

                            <select
                                value={sharePermission}
                                onChange={(event) => setSharePermission(event.target.value)}
                                className="w-full px-4 py-3 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="VIEWER">Viewer — can view</option>
                                <option value="EDITOR">Editor — can edit</option>
                            </select>

                            {shareMessage && (
                                <p
                                    className={`mt-4 text-sm ${shareMessage.startsWith("✓")
                                            ? "text-green-600"
                                            : "text-red-600"
                                        }`}
                                >
                                    {shareMessage}
                                </p>
                            )}

                            <div className="flex justify-end gap-3 mt-6">

                                <button
                                    type="button"
                                    onClick={closeShareModal}
                                    className="px-5 py-3 rounded-xl bg-slate-100 text-slate-700 font-semibold hover:bg-slate-200"
                                >
                                    Cancel
                                </button>

                                <button
                                    type="submit"
                                    disabled={sharing}
                                    className="px-5 py-3 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 disabled:bg-slate-400"
                                >
                                    {sharing ? "Sharing..." : "Share"}
                                </button>

                            </div>

                        </form>

                    </div>

                </div>

            )}

            {/* =====================================================
          CREATE FOLDER MODAL
      ===================================================== */}

            {showFolderModal && (

                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">

                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">

                        <div className="flex items-center justify-between mb-6">

                            <div>

                                <h2 className="text-xl font-bold text-slate-800">
                                    Create New Folder
                                </h2>

                                <p className="text-sm text-slate-500 mt-1">

                                    Create a folder inside{" "}

                                    <span className="font-semibold">
                                        {
                                            breadcrumbs[
                                                breadcrumbs.length -
                                                1
                                            ].name
                                        }
                                    </span>

                                </p>

                            </div>

                            <button
                                onClick={() => {
                                    setShowFolderModal(
                                        false
                                    );

                                    setFolderName("");

                                    setFolderMessage("");
                                }}
                                className="text-slate-400 hover:text-slate-700 text-xl"
                            >
                                ✕
                            </button>

                        </div>

                        <form
                            onSubmit={
                                handleCreateFolder
                            }
                        >

                            <label className="block text-sm font-semibold text-slate-700 mb-2">
                                Folder Name
                            </label>

                            <input
                                type="text"
                                value={folderName}
                                onChange={(event) =>
                                    setFolderName(
                                        event.target.value
                                    )
                                }
                                placeholder="e.g. Documents"
                                autoFocus
                                className="w-full px-4 py-3 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
                            />

                            {folderMessage && (

                                <p
                                    className={`mt-3 text-sm ${folderMessage.startsWith(
                                        "✓"
                                    )
                                            ? "text-green-600"
                                            : "text-red-600"
                                        }`}
                                >
                                    {folderMessage}
                                </p>

                            )}

                            <div className="flex justify-end gap-3 mt-6">

                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowFolderModal(
                                            false
                                        );

                                        setFolderName("");

                                        setFolderMessage("");
                                    }}
                                    className="px-5 py-3 rounded-xl bg-slate-100 text-slate-700 font-semibold hover:bg-slate-200"
                                >
                                    Cancel
                                </button>

                                <button
                                    type="submit"
                                    disabled={
                                        creatingFolder
                                    }
                                    className="px-5 py-3 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 disabled:bg-slate-400"
                                >
                                    {creatingFolder
                                        ? "Creating..."
                                        : "Create Folder"}
                                </button>

                            </div>

                        </form>

                    </div>

                </div>

            )}

            {/* =====================================================
          RENAME MODAL
      ===================================================== */}

            {showRenameModal && (

                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">

                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">

                        <div className="flex items-center justify-between mb-6">

                            <div>

                                <h2 className="text-xl font-bold text-slate-800">

                                    Rename{" "}

                                    {renameType ===
                                        "file"
                                        ? "File"
                                        : "Folder"}

                                </h2>

                                <p className="text-sm text-slate-500 mt-1">
                                    Enter the new name below.
                                </p>

                            </div>

                            <button
                                onClick={() => {
                                    setShowRenameModal(
                                        false
                                    );

                                    setRenameItem(
                                        null
                                    );

                                    setRenameName("");

                                    setRenameMessage("");
                                }}
                                className="text-slate-400 hover:text-slate-700 text-xl"
                            >
                                ✕
                            </button>

                        </div>

                        <form
                            onSubmit={
                                handleRename
                            }
                        >

                            <label className="block text-sm font-semibold text-slate-700 mb-2">
                                New Name
                            </label>

                            <input
                                type="text"
                                value={renameName}
                                onChange={(event) =>
                                    setRenameName(
                                        event.target.value
                                    )
                                }
                                autoFocus
                                className="w-full px-4 py-3 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
                            />

                            {renameMessage && (

                                <p
                                    className={`mt-3 text-sm ${renameMessage.startsWith(
                                        "✓"
                                    )
                                            ? "text-green-600"
                                            : "text-red-600"
                                        }`}
                                >
                                    {renameMessage}
                                </p>

                            )}

                            <div className="flex justify-end gap-3 mt-6">

                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowRenameModal(
                                            false
                                        );

                                        setRenameItem(
                                            null
                                        );

                                        setRenameName("");

                                        setRenameMessage("");
                                    }}
                                    className="px-5 py-3 rounded-xl bg-slate-100 text-slate-700 font-semibold hover:bg-slate-200"
                                >
                                    Cancel
                                </button>

                                <button
                                    type="submit"
                                    disabled={renaming}
                                    className="px-5 py-3 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 disabled:bg-slate-400"
                                >
                                    {renaming
                                        ? "Renaming..."
                                        : "Rename"}
                                </button>

                            </div>

                        </form>

                    </div>

                </div>

            )}

        </div>
    );
}

export default Dashboard;

