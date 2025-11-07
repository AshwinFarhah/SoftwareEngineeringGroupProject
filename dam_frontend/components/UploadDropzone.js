import { useRef, useState, useEffect } from "react";
import { Box, Text, Button, VStack, Spinner } from "@chakra-ui/react";

/**
 * UploadDropzone component
 * Supports preview for images, videos, and 3D models (.glb/.gltf)
 */
export default function UploadDropzone({ onFileSelected, preview }) {
  const inputRef = useRef();
  const [fileType, setFileType] = useState("unknown");
  const [isLoading, setIsLoading] = useState(false);

  // ✅ Load <model-viewer> only once at mount
  useEffect(() => {
    import("@google/model-viewer");
  }, []);

  const detectKind = (file) => {
    if (!file) return "unknown";
    const name = file.name?.toLowerCase() || "";
    const mime = file.type?.toLowerCase() || "";

    if (mime.startsWith("image/") || /\.(jpg|jpeg|png|webp|gif|bmp|svg)$/.test(name))
      return "image";
    if (mime.startsWith("video/") || /\.(mp4|mov|avi|mkv)$/.test(name))
      return "video";
    if (mime.includes("model") || /\.(glb|gltf|usdz|fbx|obj|stl)$/.test(name))
      return "model";
    return "unknown";
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const kind = detectKind(file);
      setFileType(kind);
      onFileSelected(file);
      setIsLoading(kind === "model");
    }
  };

  // Detect kind from preview if already known
  useEffect(() => {
    if (!preview) return;
    if (/\.(jpg|jpeg|png|webp|gif|bmp|svg)$/i.test(preview)) setFileType("image");
    else if (/\.(mp4|mov|avi|mkv)$/i.test(preview)) setFileType("video");
    else if (/\.(glb|gltf|usdz|fbx|obj|stl)$/i.test(preview)) setFileType("model");
  }, [preview]);

  return (
    <Box
      border="2px dashed"
      borderColor="gray.300"
      p={6}
      rounded="md"
      textAlign="center"
      bg="white"
      cursor="pointer"
      _hover={{ bg: "gray.50" }}
      onClick={() => inputRef.current?.click()}
    >
      <VStack spacing={3}>
        {!preview ? (
          <Text color="gray.500">
            Drag & drop your file here, or click to select
          </Text>
        ) : (
          <>
            {fileType === "image" && (
              <img
                src={preview}
                alt="Preview"
                style={{
                  maxWidth: "100%",
                  maxHeight: "250px",
                  objectFit: "contain",
                  borderRadius: "8px",
                }}
              />
            )}

            {fileType === "video" && (
              <video
                src={preview}
                controls
                style={{
                  maxWidth: "100%",
                  maxHeight: "250px",
                  borderRadius: "8px",
                }}
              />
            )}

            {fileType === "model" && (
              <Box position="relative" width="100%" height="300px">
                {isLoading && (
                  <Spinner
                    size="lg"
                    thickness="4px"
                    color="blue.400"
                    position="absolute"
                    top="50%"
                    left="50%"
                    transform="translate(-50%, -50%)"
                  />
                )}
                <model-viewer
                  src={preview}
                  camera-controls
                  auto-rotate
                  exposure="1"
                  environment-image="neutral"
                  onLoad={() => setIsLoading(false)}
                  style={{
                    width: "100%",
                    height: "300px",
                    background: "#f9fafb",
                    borderRadius: "10px",
                  }}
                />
              </Box>
            )}

            <Button size="sm" mt={2} onClick={() => inputRef.current?.click()}>
              Change File
            </Button>
          </>
        )}
      </VStack>

      <input
        type="file"
        ref={inputRef}
        onChange={handleFileChange}
        style={{ display: "none" }}
      />
    </Box>
  );
}
