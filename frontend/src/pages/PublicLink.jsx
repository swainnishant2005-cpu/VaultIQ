import { useState } from "react";

function PublicLink() {
  const token = window.location.pathname.split("/shared/")[1]?.split("/")[0];
  const [password, setPassword] = useState("");
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [message, setMessage] = useState("");

  const accessLink = async (event) => {
    event.preventDefault();

    if (!token) {
      setMessage("Invalid public link.");
      return;
    }

    try {
      setLoading(true);
      setMessage("");

      const response = await fetch(
        `https://vaultiq-xpyl.onrender.com/api/link-shares/${token}/access`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            password: password || null,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Unable to access this link.");
      }

      setItem(data);
      setMessage("");
    } catch (error) {
      setMessage(error.message || "Unable to access this link.");
    } finally {
      setLoading(false);
    }
  };

  const downloadFile = async () => {
    if (!token || !item?.id || item.type !== "file") return;

    try {
      setDownloading(true);
      setMessage("");

      const response = await fetch(
        `https://vaultiq-xpyl.onrender.com/api/link-shares/${token}/download`
      );

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.detail || "Download failed.");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = item.name || "download";
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      setMessage(error.message || "Download failed.");
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-lg bg-white rounded-3xl shadow-xl border border-slate-200 p-8">
        <div className="text-center mb-8">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-blue-600 text-white flex items-center justify-center text-3xl">
            🔗
          </div>
          <h1 className="text-3xl font-bold text-slate-800 mt-5">VaultIQ</h1>
          <p className="text-slate-500 mt-2">Secure public file sharing</p>
        </div>

        {!item ? (
          <form onSubmit={accessLink}>
            <div className="bg-slate-50 rounded-2xl p-5 mb-6">
              <p className="text-sm text-slate-600">
                You have received a public VaultIQ link. Enter the password
                below if the owner protected it.
              </p>
            </div>

            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Link Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Enter password if required"
              className="w-full px-4 py-3 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
            />

            {message && (
              <p className="mt-4 text-sm text-red-600">{message}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-6 px-5 py-3 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 disabled:bg-slate-400"
            >
              {loading ? "Checking..." : "Access Link"}
            </button>
          </form>
        ) : (
          <div>
            <div className="text-center bg-slate-50 rounded-2xl p-7">
              <div className="text-5xl mb-4">
                {item.type === "file" ? "📄" : "📁"}
              </div>
              <h2 className="text-xl font-bold text-slate-800 break-words">
                {item.name}
              </h2>
              {item.type === "file" && (
                <p className="text-sm text-slate-500 mt-2">
                  {item.mime_type || "File"} ·{" "}
                  {item.size
                    ? `${(item.size / (1024 * 1024)).toFixed(2)} MB`
                    : "Unknown size"}
                </p>
              )}
            </div>

            {item.type === "file" ? (
              <button
                onClick={downloadFile}
                disabled={downloading}
                className="w-full mt-6 px-5 py-3 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 disabled:bg-slate-400"
              >
                {downloading ? "Downloading..." : "⬇️ Download File"}
              </button>
            ) : (
              <div className="mt-6 p-4 bg-blue-50 rounded-xl text-sm text-blue-800">
                This public link points to a folder. Folder browsing can be
                added as the next sharing enhancement.
              </div>
            )}

            {message && (
              <p className="mt-4 text-sm text-red-600">{message}</p>
            )}

            <button
              onClick={() => {
                setItem(null);
                setPassword("");
              }}
              className="w-full mt-3 px-5 py-3 rounded-xl bg-slate-100 text-slate-700 font-semibold hover:bg-slate-200"
            >
              Use Another Link
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default PublicLink;

