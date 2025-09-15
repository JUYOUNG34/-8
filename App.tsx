
import React, { useState, useCallback } from 'react';
import { analyzeStudentReport } from './services/geminiService';
import type { EvaluationResult } from './types';
import ReportDashboard from './components/ReportDashboard';
import Loader from './components/Loader';
import EvaluatorReport from './components/EvaluatorReport';
import ReportEditor from './components/ReportEditor';


type View = 'input' | 'loading' | 'report' | 'evaluator' | 'editor';

const App = () => {
    const [studentReportText, setStudentReportText] = useState('');
    const [analysisResult, setAnalysisResult] = useState<EvaluationResult | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [view, setView] = useState<View>('input');

    const handleAnalysis = useCallback(async () => {
        if (!studentReportText.trim()) {
            setError('학생부 내용을 입력해주세요.');
            return;
        }
        setIsLoading(true);
        setError(null);
        setAnalysisResult(null);
        setView('loading');

        try {
            const result = await analyzeStudentReport(studentReportText);
            setAnalysisResult(result);
            setView('report');
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.';
            setError(errorMessage);
            setView('input');
        } finally {
            setIsLoading(false);
        }
    }, [studentReportText]);
    
    const handleReset = useCallback(() => {
        setAnalysisResult(null);
        setStudentReportText('');
        setError(null);
        setView('input');
    }, []);
    
    const handleSaveEdits = useCallback((updatedData: EvaluationResult) => {
        setAnalysisResult(updatedData);
        setView('report');
    }, []);


    const renderContent = () => {
        switch (view) {
            case 'loading':
                return <Loader />;
            
            case 'report':
                return analysisResult && (
                    <ReportDashboard 
                        data={analysisResult} 
                        onGoToEditor={() => setView('editor')}
                        onGoToEvaluator={() => setView('evaluator')}
                        onReset={handleReset}
                    />
                );

            case 'evaluator':
                return analysisResult && <EvaluatorReport data={analysisResult} onBack={() => setView('report')} />;

            case 'editor':
                return analysisResult && <ReportEditor originalData={analysisResult} onSaveAndClose={handleSaveEdits} />;

            case 'input':
            default:
                 return (
                    <div className="text-center pt-10">
                        <h2 className="text-3xl font-bold text-gray-800 mb-2">학생부 탐구역량 분석</h2>
                        <p className="text-lg text-gray-600">학생부 내용을 아래에 붙여넣고 '분석 시작' 버튼을 눌러주세요.</p>
                        
                        <div className="mt-8 max-w-4xl mx-auto">
                            <textarea
                                value={studentReportText}
                                onChange={(e) => setStudentReportText(e.target.value)}
                                placeholder="여기에 학생부의 '세부능력 및 특기사항', '창의적 체험활동', '행동특성 및 종합의견' 등의 내용을 붙여넣으세요..."
                                className="w-full h-96 p-4 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition duration-150 ease-in-out"
                            />
                        </div>

                        {error && (
                            <div className="mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg max-w-4xl mx-auto">
                                {error}
                            </div>
                        )}

                        <div className="mt-6">
                            <button
                                onClick={handleAnalysis}
                                disabled={isLoading}
                                className="px-8 py-3 bg-indigo-600 text-white font-bold rounded-lg shadow-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors duration-300"
                            >
                                {isLoading ? '분석 중...' : '분석 시작'}
                            </button>
                        </div>
                    </div>
                );
        }
    };
    
    return (
        <div className="min-h-screen bg-gray-50 text-gray-800 p-4 sm:p-8">
            <main className="max-w-6xl mx-auto">
                {renderContent()}
            </main>
        </div>
    );
};

export default App;
