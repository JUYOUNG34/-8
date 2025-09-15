import React, { useMemo } from 'react';
import type { EvaluationResult, CategoryScores, QuestionKey } from '../types';
import { QUESTION_MAP } from '../constants';

interface EvaluatorReportProps {
    data: EvaluationResult;
    onBack: () => void;
}

const EvaluatorReport = ({ data, onBack }: EvaluatorReportProps) => {
    const categoryData = useMemo(() => {
        const categories: Record<string, CategoryScores> = {
            'A': { key: 'A', name: 'A. 탐구력', average: 0, totalScore: 0, maxScore: 0, items: [] },
            'B': { key: 'B', name: 'B. 자기주도성', average: 0, totalScore: 0, maxScore: 0, items: [] },
            'C': { key: 'C', name: 'C. 창의적 문제해결', average: 0, totalScore: 0, maxScore: 0, items: [] },
        };

        for (const key in data.scores) {
            const categoryKey = key.charAt(0);
            if (categories[categoryKey]) {
                const scoreItem = data.scores[key as QuestionKey];
                categories[categoryKey].items.push({
                    id: key,
                    label: QUESTION_MAP[key as keyof typeof QUESTION_MAP] || 'Unknown',
                    score: scoreItem.score,
                    justification: scoreItem.justification,
                });
            }
        }
        return Object.values(categories);
    }, [data]);

    const getScoreColor = (score: number) => {
        if (score >= 7) return 'text-purple-700 font-bold';
        if (score >= 6) return 'text-indigo-600 font-semibold';
        if (score >= 5) return 'text-blue-600';
        if (score >= 4) return 'text-orange-600';
        return 'text-red-600';
    };

    return (
        <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-xl max-w-6xl mx-auto">
            <div className="flex justify-between items-center mb-6 border-b pb-4">
                <h1 className="text-3xl font-bold text-gray-800">평가자용 상세 분석 보고서</h1>
                <button
                    onClick={onBack}
                    className="px-5 py-2 bg-gray-600 text-white font-semibold rounded-lg shadow-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors duration-300"
                >
                    &larr; 리포트 돌아가기
                </button>
            </div>

            <div className="space-y-8">
                {categoryData.map(category => (
                    <div key={category.name}>
                        <h2 className="text-2xl font-bold text-gray-700 mb-4 sticky top-0 bg-white py-2">{category.name}</h2>
                        <div className="space-y-4">
                            {category.items.map(item => (
                                <div key={item.id} className="p-4 border rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
                                    <div className="flex justify-between items-baseline">
                                        <h3 className="text-lg font-semibold text-gray-800">{item.label}</h3>
                                        <p className={`text-2xl ${getScoreColor(item.score)}`}>{item.score}점</p>
                                    </div>
                                    <p className="mt-2 text-gray-600 text-sm italic">
                                        <span className="font-semibold">평가 근거:</span> {item.justification}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default EvaluatorReport;