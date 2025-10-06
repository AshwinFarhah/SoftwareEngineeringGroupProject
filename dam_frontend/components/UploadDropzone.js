import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { Box, Button, Input, VStack, Text } from "@chakra-ui/react";

export default function UploadDropzone({ token, onUploaded }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState("");
  const [category, setCategory] = useState("");

  const onDrop = useCallback(async (acceptedFiles) => {
    if (!acceptedFiles.length) return;
    const file = acceptedFiles[0];
    const formData = new FormData();
    formData.append("file", file);
    formData.append("title", title || file.name);
    formData.append("description", description);
    if (tags) formData.append("tags", tags);
    if (category) formData.append("category", category);

    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/assets/`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      });
      setTitle(""); setDescription(""); setTags(""); setCategory("");
      if(onUploaded) onUploaded();
      alert("Uploaded");
    } catch (err) {
      console.error(err);
      alert("Upload failed");
    }
  }, [title, description, tags, category, token, onUploaded]);

  const {getRootProps, getInputProps, isDragActive} = useDropzone({onDrop});

  return (
    <VStack spacing={3} align="stretch">
      <Box p={6} borderRadius="md" bg="white" border="2px dashed" {...getRootProps()}>
        <input {...getInputProps()} />
        <Text>{isDragActive ? 'Drop the file here...' : 'Drag & drop file here, or click to select'}</Text>
      </Box>
      <Input placeholder="Title" value={title} onChange={(e)=>setTitle(e.target.value)} />
      <Input placeholder="Description" value={description} onChange={(e)=>setDescription(e.target.value)} />
      <Input placeholder="Tags (comma separated)" value={tags} onChange={(e)=>setTags(e.target.value)} />
      <Input placeholder="Category ID (optional)" value={category} onChange={(e)=>setCategory(e.target.value)} />
      <Button onClick={() => document.querySelector('input[type="file"]').click()}>Choose file</Button>
    </VStack>
  );
}
