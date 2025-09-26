// frontend/pages/assets.js
import { useEffect, useState } from "react";
import { Box, Heading, Input, Button, SimpleGrid, Text } from "@chakra-ui/react";
import UploadDropzone from "../components/UploadDropzone";

export default function AssetsPage() {
  const [assets, setAssets] = useState([]);
  const [token, setToken] = useState(null);
  const [query, setQuery] = useState("");

  useEffect(() => {
    const t = localStorage.getItem("access_token");
    if (!t) return;
    setToken(t);
    fetchAssets(t);
  }, []);

  async function fetchAssets(t) {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/assets/`, {
        headers: { Authorization: `Bearer ${t}` },
      });
      const data = await res.json();
      setAssets(data);
    } catch (err) { console.error(err); }
  }

  function onUploaded() { fetchAssets(token); }

  return (
    <Box p={6}>
      <Heading>Assets</Heading>
      <Box mt={4}>
        <Input placeholder="Search" value={query} onChange={(e)=>setQuery(e.target.value)} />
        <Button mt={2} onClick={() => {
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/assets/?search=${encodeURIComponent(query)}`, { headers: { Authorization: `Bearer ${token}` } })
            .then(r => r.json()).then(setAssets).catch(console.error);
        }}>Search</Button>
      </Box>

      <Box mt={6}>
        <UploadDropzone token={token} onUploaded={onUploaded} />
      </Box>

      <SimpleGrid columns={[1,2,3]} spacing={4} mt={6}>
        {assets.map(a => (
          <Box key={a.id} borderWidth={1} p={3} borderRadius="md">
            <Text fontWeight="bold">{a.title} (v{a.version})</Text>
            <Text fontSize="sm">{a.description}</Text>
            <Text fontSize="xs">{a.category?.name}</Text>
            <a href={`${process.env.NEXT_PUBLIC_API_URL.replace('/api','')}${a.file}`} target="_blank" rel="noreferrer">Preview / Download</a>
          </Box>
        ))}
      </SimpleGrid>
    </Box>
  );
}
