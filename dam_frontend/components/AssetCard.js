import { Box, Text, Badge, HStack, Button, VStack, Divider } from "@chakra-ui/react";
import Link from "next/link";

export default function AssetCard({ asset }) {
  const base = process.env.NEXT_PUBLIC_API_URL?.replace("/api", "") || "";

  const fileUrl = asset.file?.startsWith("http")
    ? asset.file
    : `${base}${asset.file}`;

  return (
    <Box
      bg="white"
      p={5}
      rounded="lg"
      shadow="md"
      _hover={{ shadow: "lg", transform: "translateY(-3px)", transition: "0.2s" }}
    >
      <VStack align="start" spacing={3}>
        <Box>
          <Text fontWeight="bold" fontSize="lg" color="blue.700">
            {asset.title || "Untitled"}
          </Text>
          <Text fontSize="sm" color="gray.600" noOfLines={2}>
            {asset.description || "No description available."}
          </Text>
        </Box>

        {asset.tags?.length > 0 && (
          <HStack flexWrap="wrap">
            {asset.tags.map((t) => (
              <Badge key={t.id} colorScheme="blue">
                {t.name}
              </Badge>
            ))}
          </HStack>
        )}

        <Divider />

        <HStack justify="space-between" w="100%">
          <Link href={`/assets/${asset.id}`}>
            <Button size="sm" colorScheme="blue">
              View Details
            </Button>
          </Link>

          <Button
            size="sm"
            variant="outline"
            onClick={() => window.open(fileUrl, "_blank")}
          >
            Preview
          </Button>
        </HStack>
      </VStack>
    </Box>
  );
}
