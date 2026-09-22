import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { RoleProvider } from './context/RoleContext';
import { CreditProvider } from './context/CreditContext';
import { CaseProvider } from './context/CaseContext';
import { EvidenceProvider } from './context/EvidenceContext';
import { ActivityProvider } from './context/ActivityContext';
import { HistoryProvider } from './context/HistoryContext';
import { SettingsProvider } from './context/SettingsContext';
import { ThemeProvider } from './context/ThemeContext';
import { SearchHistoryProvider } from './context/SearchHistoryContext';
import { SessionProvider } from './context/SessionContext';
import { TelegramProvider } from './context/TelegramContext';
import { ToolResultProvider } from './context/ToolResultContext';
import { ToastProvider } from './components/common/Toast';
import ErrorBoundary from './components/common/ErrorBoundary';
import SessionTimeoutWarning from './components/common/SessionTimeoutWarning';
import GlobalSaveToCaseButton from './components/common/GlobalSaveToCaseButton';
import AppRoutes from './routes/AppRoutes';

function App() {
  return (
    <BrowserRouter>
      <ErrorBoundary>
        <ThemeProvider>
          <SettingsProvider>
            <ToastProvider>
              <AuthProvider>
                <SessionProvider>
                  <RoleProvider>
                    <CreditProvider>
                      <HistoryProvider>
                        <SearchHistoryProvider>
                          <CaseProvider>
                            <EvidenceProvider>
                              <ActivityProvider>
                                <TelegramProvider>
                                  <ToolResultProvider>
                                    <div className="min-h-screen bg-gray-950 dark:bg-gray-950 light:bg-gray-50 transition-colors">
                                      <AppRoutes />
                                      <SessionTimeoutWarning />
                                      <GlobalSaveToCaseButton />
                                    </div>
                                  </ToolResultProvider>
                                </TelegramProvider>
                              </ActivityProvider>
                            </EvidenceProvider>
                          </CaseProvider>
                        </SearchHistoryProvider>
                      </HistoryProvider>
                    </CreditProvider>
                  </RoleProvider>
                </SessionProvider>
              </AuthProvider>
            </ToastProvider>
          </SettingsProvider>
        </ThemeProvider>
      </ErrorBoundary>
    </BrowserRouter>
  );
}

export default App;
