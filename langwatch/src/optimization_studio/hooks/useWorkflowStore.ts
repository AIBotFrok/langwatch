import {
  type Connection,
  type Edge,
  type EdgeChange,
  type Node,
  type NodeChange,
  addEdge,
  applyEdgeChanges,
  applyNodeChanges,
} from "@xyflow/react";
import { temporal } from "zundo";
import { create } from "zustand";
import isDeepEqual from "fast-deep-equal";
import debounce from "lodash.debounce";
import type { Component, ComponentType } from "../types/dsl";

interface WorkflowStore {
  nodes: Node<Component>[];
  edges: Edge[];
  onNodesChange: (changes: NodeChange[]) => void;
  onEdgesChange: (changes: EdgeChange[]) => void;
  onConnect: (connection: Connection) => void;
  setNodes: (nodes: Node[]) => void;
  setEdges: (edges: Edge[]) => void;
}

const initialNodes: Node<Component>[] = [
  {
    id: "1",
    type: "signature",
    position: { x: 300, y: 300 },
    data: {
      name: "GenerateQuery",
      inputs: [{ identifier: "question", type: "str" }],
      outputs: [
        { identifier: "question", type: "str" },
        { identifier: "query", type: "str" },
      ],
    },
  },
  {
    id: "2",
    type: "signature",
    position: { x: 600, y: 300 },
    data: {
      name: "GenerateAnswer",
      inputs: [
        { identifier: "question", type: "str" },
        { identifier: "query", type: "str" },
      ],
      outputs: [{ identifier: "answer", type: "str" }],
    },
  },
] satisfies (Node<Component> & { type: ComponentType })[];
const initialEdges: Edge[] = [{ id: "e1-2", source: "1", target: "2" }];

const store = (
  set: (
    partial:
      | WorkflowStore
      | Partial<WorkflowStore>
      | ((state: WorkflowStore) => WorkflowStore | Partial<WorkflowStore>),
    replace?: boolean | undefined
  ) => void,
  get: () => WorkflowStore
) => ({
  nodes: initialNodes,
  edges: initialEdges,
  onNodesChange: (changes: NodeChange[]) => {
    set({
      nodes: applyNodeChanges(changes, get().nodes),
    });
  },
  onEdgesChange: (changes: EdgeChange[]) => {
    set({
      edges: applyEdgeChanges(changes, get().edges),
    });
  },
  onConnect: (connection: Connection) => {
    set({
      edges: addEdge(connection, get().edges),
    });
  },
  setNodes: (nodes: Node[]) => {
    set({ nodes });
  },
  setEdges: (edges: Edge[]) => {
    set({ edges });
  },
});

export const useWorkflowStore = create<WorkflowStore>()(
  temporal(store, {
    partialize: (state) => {
      const state_ = {
        ...state,
        edges: state.edges.map((edge) => {
          const edge_ = { ...edge };
          delete edge_.selected;
          return edge_;
        }),
        nodes: state.nodes.map((node) => {
          const node_ = { ...node };
          delete node_.selected;
          return node_;
        }),
      };
      return state_;
    },
    handleSet: (handleSet) => {
      return debounce<typeof handleSet>(
        (pastState) => {
          if ((pastState as any).nodes?.some((node: Node) => node.dragging)) {
            return;
          }
          handleSet(pastState);
        },

        // Our goal is to store the previous state to mark it as a "history entry" whenever state changes,
        // however, sometimes two pieces of state change in a very short period of time, and we don't want to
        // create two or more entries on the undo. We then store the pastState as soon as the debounce begins,
        // and only try to store again if more than 100ms has passed since the last state change.
        100,
        { leading: true, trailing: false }
      );
    },
    equality: (pastState, currentState) => isDeepEqual(pastState, currentState),
  })
);
