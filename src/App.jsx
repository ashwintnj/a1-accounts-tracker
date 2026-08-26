import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import PwaUpdatePrompt from './components/PwaUpdatePrompt';
import { AuthProvider, useAuth } from './lib/AuthContext';
import DailyEntryPage from './pages/DailyEntryPage';
import HistoryPage from './pages/HistoryPage';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import MonthlySummaryPage from './pages/MonthlySummaryPage';
import SummaryPage from './pages/SummaryPage';

const AppRoutes = () => {
    const { user } = useAuth();

    return (
        <Routes>
            <Route path="/login" element={user ? <Navigate to="/" replace /> : <LoginPage />} />
            <Route
                path="/"
                element={
                    <ProtectedRoute>
                        <Layout>
                            <HomePage />
                        </Layout>
                    </ProtectedRoute>
                }
            />
            <Route
                path="/entry"
                element={
                    <ProtectedRoute>
                        <Layout>
                            <DailyEntryPage />
                        </Layout>
                    </ProtectedRoute>
                }
            />
            <Route
                path="/entry/:date"
                element={
                    <ProtectedRoute>
                        <Layout>
                            <DailyEntryPage />
                        </Layout>
                    </ProtectedRoute>
                }
            />
            <Route
                path="/history"
                element={
                    <ProtectedRoute>
                        <Layout>
                            <HistoryPage />
                        </Layout>
                    </ProtectedRoute>
                }
            />
            <Route
                path="/monthly-summary"
                element={
                    <ProtectedRoute>
                        <Layout>
                            <MonthlySummaryPage />
                        </Layout>
                    </ProtectedRoute>
                }
            />
            <Route
                path="/summary"
                element={
                    <ProtectedRoute>
                        <Layout>
                            <SummaryPage />
                        </Layout>
                    </ProtectedRoute>
                }
            />
        </Routes>
    );
};

const App = () => {
    return (
        <AuthProvider>
            <BrowserRouter>
                <AppRoutes />
                <PwaUpdatePrompt />
            </BrowserRouter>
        </AuthProvider>
    );
};

export default App;
