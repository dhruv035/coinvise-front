import dynamic from "next/dynamic";
import type { NextPage } from "next";
import {
  Dispatch,
  SetStateAction,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  Box,
  Button,
  Checkbox,
  FormControl,
  FormLabel,
  Input,
  SimpleGrid,
  Textarea,
  useToast,
} from "@chakra-ui/react";
import {
  useAccount,
  useContractRead,
  useContractReads,
  useContractWrite,
  useWaitForTransaction,
} from "wagmi";
import { MarketCard } from "../components/General";
import { Factory, NFT } from "../abi";
import { useContext, createContext } from "react";
import { FlowContext } from "./_app";
import Search from "../components/Search";
import { useFormik } from "formik";
import { parseEther } from "viem";
import { readContract } from "@wagmi/core";
import { AppContext, AppContextType } from "../contexts/appContext";

const Home: NextPage = () => {
  const flowContext = useContext(FlowContext);
  const toast = useToast();
  const { memberships } = useContext(AppContext) as AppContextType;
  const { address } = useAccount();
  const [membershipData, setMembershipData] = useState<any[]>([]);
  const getMembershipData = useCallback(async () => {
    if (!address) return;
    const contracts = await Promise.all(
      memberships.map(async (membership) => {
        const balance = readContract({
          address: membership,
          abi: NFT,
          functionName: "balanceOf",
          args: [address],
        });
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
        return Promise.all([balance, currentPrice, baseURI, membership]);
      })
    );
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
            if (!element) return {};
            if (element.status === 200) {
              let data;
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
  }, [memberships]);

  useEffect(() => {
    getMembershipData();
  }, [memberships]);
  return (
    <div className=" pt-6 flex flex-col w-full max-w-[94vw] bg-cover">
      <div className="flex flex-col items-center">
        <div className="text-transparent font-kenia bg-clip-text bg-pinkFlavor text-[44px] sm:text-[52px] text-center md:text-[60px] font-bold">
          DeCommune
        </div>
        <Search />
      </div>
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
export default dynamic(() => Promise.resolve(Home), {
  ssr: false,
});

//Listing Section: Display all memberships available for purchase on the platform
//Network: Your Memberships as Creator/Member

//Create Section: Create New Memberships
