import {
  Card,
  CardBody,
  Image,
  Stack,
  Heading,
  Text,
  Divider,
  CardFooter,
  ButtonGroup,
  Button,
  useToast,
} from "@chakra-ui/react";
import { useAccount, useContractReads, useContractWrite } from "wagmi";
import { NFT } from "../../abi";
import { useContext, useMemo } from "react";
import { formatEther } from "viem";
import { AppContext,AppContextType } from "../../contexts/appContext";
type Membership = {
  contractData: any;
  metaData: any;
};
const MarketCard = ({
  membership,
  owned = false,
}: {
  membership: Membership;
  owned?: boolean;
}) => {
  const toast = useToast();
  const { pendingTx, setPendingTx, isTxDisabled, setIsTxDisabled } =
    useContext(AppContext) as AppContextType;
  const { address } = useAccount();
  const nftContract = {
    address: membership.contractData[3],
    abi: NFT,
  };
  const { data, isLoading, error } = useContractReads({
    contracts: [
      {
        ...nftContract,
        functionName: "baseURI",
      },
      {
        ...nftContract,
        functionName: "currentPrice",
      },
    ],
  });

  const { writeAsync: buy } = useContractWrite({
    ...nftContract,
    functionName: "safeMint",
  });

  const image = 0;
  const handleBuy = async () => {
    if (!address) return;
    if (!data || !data[1]) return;
    if (typeof data[1].result !== "bigint") return;
    setIsTxDisabled(true);
    let hash;
    try {
      const { hash: txHash } = await buy({
        args: [address],
        value: data[1].result,
      });
      hash = txHash;
      toast({
        position: "top-right",
        title: "Transaction Submitted",
        description: "Your transaction has been submitted",
        status: "loading",
        isClosable: true,
        duration: 5000,
      });
    } catch (error) {
      toast({
        position: "top-right",
        title: "Transaction error",
        description: "Error submitting your transaction",
        status: "error",
        isClosable: true,
        duration: 5000,
      });
      setIsTxDisabled(false);
    }
    setPendingTx(hash);
  };
  return (
    <Card
      maxW="sm"
      backgroundColor="black"
      padding={2}
      textColor="red.400"
      opacity={0.8}
    >
      <CardBody>
        <Image
          src={
            image
              ? image
              : "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1770&q=80"
          }
          alt="Green double couch with wooden legs"
          borderRadius="lg"
        />
        <Stack mt="6" spacing="3" opacity={0.4}>
          <Heading size="md">{membership?.contractData[3]}</Heading>
          <Text>{membership?.metaData?.desc}</Text>
          <Text color="blue.600" fontSize="2xl">
            {formatEther(membership.contractData[1])} MATIC
          </Text>
        </Stack>
      </CardBody>
      <Divider />
      {!owned && (
        <CardFooter>
          <ButtonGroup spacing="2">
            <Button
              variant="solid"
              onClick={() => {
                handleBuy();
              }}
              colorScheme="blue"
              isDisabled={isTxDisabled}
            >
              Buy now
            </Button>
          </ButtonGroup>
        </CardFooter>
      )}
    </Card>
  );
};
export default MarketCard;
