import { Box, Text, Button, Heading, Divider, HStack } from "@chakra-ui/react";
import { useRouter } from "next/router";

// Helper: detect file type
const detectKind = (name = "") => {
  const s = String(name).toLowerCase();
  if (!s) return "unknown";
  if (/\.(jpg|jpeg|png|webp|gif|bmp|svg)$/.test(s)) return "image";
  if (s.endsWith(".mp4")) return "video";
  if (s.endsWith(".pdf")) return "pdf";
  if (/\.(glb|gltf|usdz)$/.test(s)) return "model";
  return "unknown";
};

// Helper: open 3D file in a fullscreen viewer
async function openModelInNewTab({ srcUrl, token, title = "3D Preview" }) {
  try {
    let objectUrl = null;
    try {
      const res = await fetch(srcUrl, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) throw new Error("fetch failed");
      const blob = await res.blob();
      objectUrl = URL.createObjectURL(blob);
    } catch {
      objectUrl = srcUrl;
    }

    const w = window.open("", "_blank");
    if (!w) return;

    const safeTitle = (title || "3D Preview").replace(/</g, "&lt;");

    const html = `<!doctype html>
<html><head>
<meta charset="utf-8"/><title>${safeTitle}</title>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<script type="module" src="https://unpkg.com/@google/model-viewer@latest/dist/model-viewer.min.js"></script>
<style>
  html,body{height:100%;margin:0;background:#0b1020;color:#fff;font-family:system-ui,Segoe UI,Roboto,Helvetica,Arial;}
  model-viewer{width:100vw;height:100vh;background:transparent;}
  .bar{position:fixed;inset:12px 12px auto 12px;display:flex;gap:10px;align-items:center;z-index:2}
  .ttl{font-weight:600;opacity:.9}
  .btn{border:1px solid #3b82f6;background:#1f2937;color:#fff;border-radius:10px;padding:8px 12px;cursor:pointer}
</style>
</head>
<body>
  <div class="bar"><span class="ttl">${safeTitle}</span>
    <button id="dl" class="btn">Download</button>
  </div>
  <model-viewer src="${objectUrl}" camera-controls auto-rotate environment-image="neutral" exposure="1"></model-viewer>
  <script>
    document.getElementById('dl').onclick=()=>{
      const a=document.createElement('a');
      a.href="${objectUrl}";
      a.download=${JSON.stringify(title || "model")};
      document.body.appendChild(a);a.click();a.remove();
    };
  </script>
</body></html>`;

    w.document.open(); w.document.write(html); w.document.close();
  } catch {
    window.open(srcUrl, "_blank", "noopener,noreferrer");
  }
}

export default function AssetCard({ asset }) {
  const router = useRouter();
  const base = process.env.NEXT_PUBLIC_API_URL?.replace("/api", "") || "";
  const fileUrl = asset.file?.startsWith("http") ? asset.file : `${base}${asset.file}`;
  const kind = detectKind(asset.file || "");

  return (
    <Box
      p={4}
      borderWidth="1px"
      borderRadius="md"
      shadow="sm"
      bg="white"
      _hover={{ shadow: "md" }}
    >
      <Heading size="md" mb={1}>
        {asset.title || "Untitled"}
      </Heading>
      <Text fontSize="sm" color="gray.600" noOfLines={2}>
        {asset.description || "No description available."}
      </Text>
      <Divider my={3} />
      <HStack justify="space-between">
        <Button colorScheme="blue" size="sm" onClick={() => router.push(`/assets/${asset.id}`)}>
          View Details
        </Button>

        <Button
          size="sm"
          variant="outline"
          onClick={() => {
            const token = localStorage.getItem("access_token");
            if (kind === "model") {
              openModelInNewTab({
                srcUrl: fileUrl,
                token,
                title: asset.title || "3D Model",
              });
            } else {
              window.open(fileUrl, "_blank");
            }
          }}
        >
          Preview
        </Button>
      </HStack>
    </Box>
  );
}
