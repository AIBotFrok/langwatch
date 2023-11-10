import {
  Box,
  Button,
  FormControl,
  FormLabel,
  HStack,
  Heading,
  Input,
  Text,
  VStack,
  useRadio,
  type UseRadioProps,
} from "@chakra-ui/react";
import ErrorPage from "next/error";
import { useRouter } from "next/router";
import { useEffect, type PropsWithChildren } from "react";
import { useForm, type SubmitHandler } from "react-hook-form";
import { SetupLayout } from "~/components/SetupLayout";
import { useOrganizationTeamProject } from "../../../hooks/useOrganizationTeamProject";
import { useRequiredSession } from "../../../hooks/useRequiredSession";
import {
  TechStackSelector,
  type ProjectFormData,
} from "~/components/TechStack";
import { api } from "../../../utils/api";
import { useLocalStorage } from "usehooks-ts";

export function RadioCard(props: UseRadioProps & PropsWithChildren) {
  const { getInputProps, getRadioProps } = useRadio(props);

  const input = getInputProps();
  const checkbox = getRadioProps();

  return (
    <Box height="auto" as="label">
      <input {...input} />
      <Box
        {...checkbox}
        cursor="pointer"
        // borderWidth="1px"
        borderRadius="md"
        // boxShadow="md"
        _hover={{
          backgroundColor: "gray.50",
        }}
        _checked={{
          // borderColor: "orange.600",
          backgroundColor: "gray.100",
          // borderWidth: "2px"
        }}
        px={5}
        py={3}
        height="full"
        display="flex"
        alignItems="center"
      >
        {props.children}
      </Box>
    </Box>
  );
}

export default function ProjectOnboarding() {
  useRequiredSession();

  const form = useForm<ProjectFormData>({
    defaultValues: {
      language: "python",
      framework: "openai",
    },
  });

  const router = useRouter();
  const { organization } = useOrganizationTeamProject({
    redirectToProjectOnboarding: false,
  });

  const { team: teamSlug } = router.query;
  const team = api.team.getBySlug.useQuery(
    { slug: typeof teamSlug == "string" ? teamSlug : "" },
    { enabled: !!organization }
  );

  const createProject = api.project.create.useMutation();
  const apiContext = api.useContext();

  const onSubmit: SubmitHandler<ProjectFormData> = (data: ProjectFormData) => {
    if (!team.data) return;

    createProject.mutate({
      name: data.name,
      teamId: team.data.id,
      language: data.language,
      framework: data.framework,
    });
  };

  useEffect(() => {
    if (createProject.isSuccess) {
      void (async () => {
        await apiContext.organization.getAll.refetch();
        // For some reason even though we await for the refetch it's not done yet when we move pages
        setTimeout(() => {
          void router.push(`/${createProject.data.projectSlug}/messages`);
        }, 1000);
      })();
    }
  }, [
    apiContext.organization,
    apiContext.organization.getAll,
    createProject.data?.projectSlug,
    createProject.isSuccess,
    router,
  ]);

  if (team.isFetched && !team.data) {
    return <ErrorPage statusCode={404} />;
  }

  return (
    <SetupLayout>
      {/* eslint-disable-next-line @typescript-eslint/no-misused-promises */}
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <VStack gap={4} alignItems="left">
          <Heading as="h1" fontSize="x-large">
            Create New Project
          </Heading>
          <Text paddingBottom={4} fontSize="14px">
            You can set up separate projects for each service or LLM feature of
            your application (for example, one for your ChatBot, another for
            that Content Generation feature).
            <br />
          </Text>
          <FormControl>
            <FormLabel>Project Name</FormLabel>
            <Input {...form.register("name", { required: true })} />
          </FormControl>
          <TechStackSelector form={form} />
          {createProject.error && <p>Something went wrong!</p>}
          <HStack width="full">
            <Button
              colorScheme="orange"
              type="submit"
              disabled={createProject.isLoading}
            >
              {createProject.isLoading || createProject.isSuccess
                ? "Loading..."
                : "Next"}
            </Button>
          </HStack>
        </VStack>
      </form>
    </SetupLayout>
  );
}
