import { useEffect, useState } from "react";
import { Box, Heading, Text, SimpleGrid, VStack, Button, Grid } from "@chakra-ui/react";
import Layout from "../components/Layout";
import StatsCard from "../components/StatsCard";
import AssetCard from "../components/AssetCard";
import { useRouter } from "next/router";

export default function Dashboard(){
  const [counts, setCounts] = useState({ assets: 0, categories: 0, tags: 0 });
  const [recent, setRecent] = useState([]);
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if(!token) { router.replace('/login'); return; }

    // Fetch counts from backend
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/assets/`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(data => {
        const assetCount = data.count || (Array.isArray(data) ? data.length : 0);
        setCounts(prev=>({ ...prev, assets: assetCount }));
        setRecent(Array.isArray(data.results) ? data.results.slice(0,6) : (Array.isArray(data) ? data.slice(0,6) : []));
      }).catch(console.error);

    fetch(`${process.env.NEXT_PUBLIC_API_URL}/categories/`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r=>r.json()).then(d=> setCounts(prev => ({ ...prev, categories: Array.isArray(d) ? d.length : 0 }))).catch(()=>{});

    fetch(`${process.env.NEXT_PUBLIC_API_URL}/tags/`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r=>r.json()).then(d=> setCounts(prev => ({ ...prev, tags: Array.isArray(d) ? d.length : 0 }))).catch(()=>{});
  }, []);

  return (
    <Layout>
      <Box>
        <Heading>Dashboard</Heading>
        <Text color="gray.600" mt={2}>Welcome back — quick overview of your DAM system.</Text>

        <SimpleGrid columns={[1,3]} spacing={4} mt={6}>
          <StatsCard title="Total Assets" value={counts.assets} subtitle="All uploaded files" />
          <StatsCard title="Categories" value={counts.categories} subtitle="Asset categories" />
          <StatsCard title="Tags" value={counts.tags} subtitle="Unique tags" />
        </SimpleGrid>

        <Grid templateColumns={["1fr","2fr 1fr"]} gap={6} mt={8}>
          <Box>
            <Heading size="md" mb={4}>Recent Uploads</Heading>
            <SimpleGrid columns={[1,2]} spacing={3}>
              {recent.map(a => <AssetCard key={a.id} asset={a} />)}
            </SimpleGrid>
          </Box>

          <Box bg="white" p={4} borderRadius="md" boxShadow="sm">
            <Heading size="md" mb={3}>Quick Actions</Heading>
            <VStack spacing={3} align="stretch">
              <Button colorScheme="blue" onClick={() => router.push('/assets')}>Upload / Manage Assets</Button>
              <Button colorScheme="teal" onClick={() => router.push('/metadata')}>Manage Metadata</Button>
              <Button colorScheme="purple" onClick={() => router.push('/search')}>Search & Filters</Button>
            </VStack>
          </Box>
        </Grid>
      </Box>
    </Layout>
  );
}
