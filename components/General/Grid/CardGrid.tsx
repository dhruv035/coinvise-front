import { SimpleGrid } from "@chakra-ui/react";
import { readContract } from "@wagmi/core";
import { NextPage } from "next";
import { useCallback, useEffect, useState } from "react";
import { useAccount } from "wagmi";
import { NFT } from "../../../abi";
import MarketCard from "./MarketCard";

type CardGridProps = {
  memberships: readonly `0x${string}`[];
  isFilter: boolean;
};
const CardGrid: NextPage<CardGridProps> = ({ memberships, isFilter }) => {
  const { address } = useAccount();
  const [membershipData, setMembershipData] = useState<any[]>([]);
  const getMembershipData = useCallback(async () => {
    const contracts = await Promise.all(
      memberships.map(async (membership) => {
        const balance = async () => {
          let data;
          try {
            data = await readContract({
              address: membership,
              abi: NFT,
              functionName: "balanceOf",
              args: [address ?? ("" as `0x${string}`)],
            });
            return data;
          } catch (error) {
            return BigInt(0);
          }
        };
        const currentPrice = readContract({
          address: membership,
          abi: NFT,
          functionName: "currentPrice",
        });
        const baseURI = readContract({
          address: membership,
          abi: NFT,
          functionName: "baseURI",
        });
        console.log("HERE1");
        return Promise.all([balance(), currentPrice, baseURI, membership]);
      })
    ).then((res) => {
      if (isFilter)
        return res.filter((element) => {
          return Number(element[0]) > 0;
        });
      else return res;
    });

    const metaDatas = await Promise.all(
      contracts.map(async (contract) => {
        try {
          const data = await fetch(contract[2]);
          return data;
        } catch (error) {
          return undefined;
        }
      })
    )
      .then(async (res) => {
        return await Promise.all(
          res.map(async (element) => {
            if (!element) return;
            if (element.status === 200) {
              try {
                return element.json();
              } catch (error) {}
            }
          })
        );
      })
      .then((res) => {
        return res.map((element, index) => {
          const data = contracts[index];

          return {
            contractData: data,
            metaData: element,
          };
        });
      });
    setMembershipData(metaDatas);
  }, [memberships, isFilter, address]);

  useEffect(() => {
    getMembershipData();
  }, [memberships, isFilter, address]);
  return (
    <div>
      <SimpleGrid className="mt-10 ml-10 " columns={[1, 3]} spacing={12}>
        {membershipData.map((membership, index) => {
          return (
            <div key={index}>
              <MarketCard membership={membership} />
            </div>
          );
        })}
      </SimpleGrid>
    </div>
  );
};

export default CardGrid;
