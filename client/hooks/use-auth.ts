"use client";
import {useMutation, useQuery , useQueryClient} from "@tanstack/react-query";
import {useRouter} from "next/navigation";
import { api, ApiError } from "@/lib/api";
import { queryKeys} from "@/hooks/query-keys";



export const AUTH_COOKIE = "devpilot_auth";


export function setAuthCookie(authed: boolean) {
    if (typeof document === "undefined") return;
    if (authed) {
        document.cookie = `${AUTH_COOKIE}=1; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`;
    } else {
        document.cookie = `${AUTH_COOKIE}=; path=/; max-age=0; SameSite=Lax`;
    }
}

export function hasAuthCookie(): boolean {
    if (typeof document === "undefined") return false;
    return document.cookie.split(";").some((c) => c.trim().startsWith(`${AUTH_COOKIE}=1`));
}

export function useCurrentUser(options?: { enabled?: boolean }){
     return useQuery({
        queryKey: queryKeys.auth.me(),
        retry: false,
        enabled: options?.enabled ?? true,
        queryFn: async()=>{
            try {
                const user = await api.me();
                setAuthCookie(true);
                return user;
            } catch (error) {
                setAuthCookie(false); 
                if (error instanceof ApiError && error.status === 401) {
                    return null;
                }
                throw error;
            }
        }
     })
}


export function useLogout(){
    const queryClient = useQueryClient();
    const router = useRouter();

    return useMutation({
        mutationFn: async()=>{
            await api.logout();
        },
        onSuccess: ()=>{
            setAuthCookie(false);
            queryClient.invalidateQueries({ queryKey: queryKeys.auth.all });
            router.replace("/login");
        },
    });
}

export function useAuth() {
    const query = useCurrentUser();
    return {
        ...query,
        user: query.data,
        isAuthenticated: Boolean(query.data),
    };
}