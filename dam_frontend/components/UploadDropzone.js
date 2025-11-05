import { useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Box, Text, VStack, Image } from "@chakra-ui/react";

export default function UploadDropzone({ onFileSelected, preview }) {
  const onDrop = useCallback((acceptedFiles) => {
    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0];
      onFileSelected(file);
    }
  }, [onFileSelected]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: false,
  });

  return (
    <VStack spacing={3} align="stretch">
      <Box
        p={8}
        borderRadius="md"
        bg={isDragActive ? "blue.50" : "gray.50"}
        border="2px dashed #3182ce"
        textAlign="center"
        cursor="pointer"
        transition="0.2s"
        {...getRootProps()}
      >
        <input {...getInputProps()} />
        <Text color="gray.600">
          {isDragActive
            ? "Drop your file here..."
            : "Drag & drop your file here, or click to select"}
        </Text>
      </Box>

      {preview && (
        <Box textAlign="center">
          <Text fontWeight="semibold" mb={2}>
            Preview:
          </Text>
          <Image
            src={preview}
            alt="Preview"
            maxH="200px"
            mx="auto"
            rounded="lg"
          />
        </Box>
      )}
    </VStack>
  );
}
