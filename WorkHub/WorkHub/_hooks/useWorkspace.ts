import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { DemoService } from "../_service/demoService";
import { CreateWork, Status } from "../_scheme/work";

export function useWorkspace(service: DemoService) {
  const cache = useQueryClient();
  const refresh = () => cache.invalidateQueries({ queryKey: ["workspace"] });
  const query = useQuery({
    queryKey: ["workspace"],
    queryFn: () => service.read(),
    staleTime: Infinity,
  });
  const create = useMutation({
    mutationFn: (data: CreateWork) => service.create(data),
    onSuccess: refresh,
  });
  const change = useMutation({
    mutationFn: ({ id, status }: { id: string; status: Status }) =>
      service.changeStatus(id, status),
    onSuccess: refresh,
  });
  const comment = useMutation({
    mutationFn: ({ id, text }: { id: string; text: string }) =>
      service.comment(id, text),
    onSuccess: refresh,
  });
  const reset = useMutation({
    mutationFn: () => service.reset(),
    onSuccess: refresh,
  });
  return { ...query, create, change, comment, reset };
}
