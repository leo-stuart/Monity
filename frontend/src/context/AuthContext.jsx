import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '../utils/supabase';
import { checkSubscription } from '../utils/subscription';

const AuthContext = createContext();

export const useAuth = () => {
    return useContext(AuthContext);
};

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isAdmin, setIsAdmin] = useState(false);
    const [subscriptionTier, setSubscriptionTier] = useState('free');

    const refreshSubscription = useCallback(async () => {
        try {
            const tier = await checkSubscription();
            setSubscriptionTier(tier);
        } catch (error) {
            console.error('Failed to refresh subscription tier:', error);
            setSubscriptionTier('free');
        }
    }, []);

    useEffect(() => {
        const setInitialSession = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            const currentUser = session?.user ?? null;
            setUser(currentUser);
            setIsAdmin(currentUser?.user_metadata?.role === 'admin');
            
            if (currentUser) {
                await refreshSubscription();
            }
            setLoading(false);
        };

        setInitialSession();

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            const currentUser = session?.user ?? null;
            setUser(currentUser);
            setIsAdmin(currentUser?.user_metadata?.role === 'admin');

            if (currentUser) {
                refreshSubscription();
            } else {
                setSubscriptionTier('free');
            }
        });

        return () => {
            subscription?.unsubscribe();
        };
    }, [refreshSubscription]);

    const login = async (email, password) => {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
            throw new Error(error.message);
        }
        await refreshSubscription();
    };

    const signup = async (name, email, password, role = 'user') => {
        const { error } = await supabase.auth.signUp(
            { 
                email, 
                password,
                options: {
                    data: {
                        name,
                        role
                    }
                }
            }
        );
        if (error) {
            return { success: false, error: error.message };
        }
        return { success: true };
    };

    const logout = async () => {
        await supabase.auth.signOut();
        setUser(null);
    };

    const value = {
        user,
        loading,
        isAdmin,
        subscriptionTier,
        login,
        signup,
        logout,
        refreshSubscription
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
} 