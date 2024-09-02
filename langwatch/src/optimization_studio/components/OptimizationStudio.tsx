import { Box, HStack, Text, Tooltip, useTheme, VStack } from "@chakra-ui/react";
import {
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  ReactFlow,
} from "@xyflow/react";

import "@xyflow/react/dist/style.css";
import { useEffect, useMemo } from "react";
import { useShallow } from "zustand/react/shallow";
import { LogoIcon } from "../../components/icons/LogoIcon";
import { useWorkflowStore } from "../hooks/useWorkflowStore";
import { EntryNode, SignatureNode } from "./Nodes";
import { UndoRedo } from "./UndoRedo";
import DefaultEdge from "./Edge";
import { PropertiesPanel } from "./PropertiesPanel";
import { useSocketClient } from "../hooks/useSocketClient";
import { useOrganizationTeamProject } from "../../hooks/useOrganizationTeamProject";
import { titleCase } from "../../utils/stringCasing";

export default function OptimizationStudio() {
  const nodeTypes = useMemo(
    () => ({ entry: EntryNode, signature: SignatureNode }),
    []
  );
  const edgeTypes = useMemo(() => ({ default: DefaultEdge }), []);
  const theme = useTheme();
  const gray100 = theme.colors.gray["100"];
  const gray300 = theme.colors.gray["300"];

  const { nodes, edges, onNodesChange, onEdgesChange, onConnect } =
    useWorkflowStore(
      useShallow((state) => {
        if (typeof window !== "undefined") {
          // @ts-ignore
          window.state = state;
        }
        return {
          nodes: state.nodes,
          edges: state.edges,
          onNodesChange: state.onNodesChange,
          onEdgesChange: state.onEdgesChange,
          onConnect: state.onConnect,
        };
      })
    );

  const { project } = useOrganizationTeamProject();
  const { socketStatus, connect, disconnect } = useSocketClient();

  useEffect(() => {
    if (!project) return;

    connect();

    return () => {
      disconnect();
    };
  }, [connect, disconnect, project]);

  return (
    <div style={{ width: "100vw", height: "100vh" }}>
      <VStack width="full" height="full" spacing={0}>
        <HStack
          width="full"
          background="white"
          padding={2}
          borderBottom="1px solid"
          borderColor="gray.350"
        >
          <HStack width="full">
            <LogoIcon width={24} height={24} />
          </HStack>
          <HStack width="full" justify="center">
            <Text>Optimization Studio</Text>
            <Tooltip label={titleCase(socketStatus)}>
              <Box
                width="12px"
                height="12px"
                background={
                  socketStatus === "connected"
                    ? "green.500"
                    : socketStatus === "disconnected"
                    ? "red.300"
                    : "yellow.500"
                }
                borderRadius="full"
              ></Box>
            </Tooltip>
          </HStack>
          <HStack width="full" justify="end">
            <UndoRedo />
          </HStack>
        </HStack>
        <Box width="full" height="full" position="relative">
          <ReactFlow
            nodeTypes={nodeTypes}
            edgeTypes={edgeTypes}
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            style={{ width: "100%", height: "100%" }}
          >
            <Controls />
            <MiniMap />
            <Background
              variant={BackgroundVariant.Dots}
              gap={12}
              size={2}
              bgColor={gray100}
              color={gray300}
            />
          </ReactFlow>
          <PropertiesPanel />
        </Box>
      </VStack>
    </div>
  );
}
