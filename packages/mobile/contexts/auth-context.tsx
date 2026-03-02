import {
	createContext,
	type ReactNode,
	useCallback,
	useContext,
	useEffect,
	useState,
} from "react";
import {
	signIn as apiSignIn,
	signOut as apiSignOut,
	checkAuth,
} from "@/lib/api";

type AuthContextType = {
	isAuthenticated: boolean | null; // null = loading
	isLoading: boolean;
	signIn: (
		email: string,
		password: string,
	) => Promise<{ success: boolean; error?: string }>;
	signOut: () => Promise<void>;
	checkAuthStatus: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
	const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
	const [isLoading, setIsLoading] = useState(true);

	const checkAuthStatus = useCallback(async () => {
		setIsLoading(true);
		try {
			const result = await checkAuth();
			setIsAuthenticated(result.authenticated);
		} catch (error) {
			console.error("Auth check failed:", error);
			setIsAuthenticated(false);
		} finally {
			setIsLoading(false);
		}
	}, []);

	const signIn = async (email: string, password: string) => {
		const result = await apiSignIn(email, password);
		if (result.success) {
			setIsAuthenticated(true);
		}
		return result;
	};

	const signOut = async () => {
		await apiSignOut();
		setIsAuthenticated(false);
	};

	useEffect(() => {
		checkAuthStatus();
	}, [checkAuthStatus]);

	return (
		<AuthContext.Provider
			value={{
				isAuthenticated,
				isLoading,
				signIn,
				signOut,
				checkAuthStatus,
			}}
		>
			{children}
		</AuthContext.Provider>
	);
}

export function useAuth() {
	const context = useContext(AuthContext);
	if (context === undefined) {
		throw new Error("useAuth must be used within an AuthProvider");
	}
	return context;
}
