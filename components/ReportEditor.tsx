import React, { useState, useMemo, useCallback } from 'react';
import ReportDashboard from './ReportDashboard';
import type { EvaluationResult, QuestionKey } from '../types';
import { QUESTION_MAP } from '../constants';

interface ReportEditorProps {
    originalData: EvaluationResult;
    onSaveAndClose: (updatedData: EvaluationResult) => void;
}

const ReportEditor = ({ originalData, onSaveAndClose }: ReportEditorProps) => {
    const [editedData, setEditedData] = useState(originalData);

    const handleScoreChange = useCallback((key: QuestionKey, value: string) => {
        const newScore = parseInt(value, 10);
        const maxScore = key.startsWith('B') ? 5 : 7;
        if (isNaN(newScore) || newScore < 3 || newScore > maxScore) return;

        setEditedData(prevData => ({
            ...prevData,
            scores: {
                ...prevData.scores,
                [key]: {
                    ...prevData.scores[key],
                    score: newScore
                }
            }
        }));
    }, []);

    const handleTextChange = useCallback((field: keyof EvaluationResult, value: string) => {
        setEditedData(prevData => ({
            ...prevData,
            [field]: value
        }));
    }, []);

    const handleActivityChange = useCallback((index: number, field: 'title' | 'description', value: string) => {
        setEditedData(prevData => {
            const newActivities = [...prevData.representativeActivities];
            newActivities[index] = { ...newActivities[index], [field]: value };
            return { ...prevData, representativeActivities: newActivities };
        });
    }, []);
    
    const handleExcellentExampleChange = useCallback((index: number, field: 'tag' | 'title' | 'description', value: string) => {
        setEditedData(prevData => {
            const newExamples = [...prevData.inquiryExcellentExamples];
            newExamples[index] = { ...newExamples[index], [field]: value };
            return { ...prevData, inquiryExcellentExamples: newExamples };
        });
    }, []);

    const handleImprovementExampleChange = useCallback((field: 'tag' | 'title' | 'description', value: string) => {
        setEditedData(prevData => ({
            ...prevData,
            inquiryImprovementExample: {
                ...prevData.inquiryImprovementExample,
                [field]: value
            }
        }));
    }, []);


    const scoreCategories = useMemo(() => {
         const categories: Record<string, {name: string, items: QuestionKey[]}> = {
            'A': { name: 'A. 탐구력', items: [] },
            'B': { name: 'B. 자기주도성', items: [] },
            'C': { name: 'C. 창의적 문제해결', items: [] },
        };
        (Object.keys(editedData.scores) as QuestionKey[]).forEach(key => {
            const categoryKey = key.charAt(0);
            if (categories[categoryKey]) {
                categories[categoryKey].items.push(key);
            }
        });
        return Object.values(categories);
    }, [editedData.scores]);


    return (
        <div className="max-w-full mx-auto">
            <div className="flex justify-between items-center mb-6">
                 <h1 className="text-3xl font-bold text-gray-800">탐구역량 점수 및 내용 수정</h1>
                 <button
                    onClick={() => onSaveAndClose(editedData)}
                    className="px-5 py-2 bg-indigo-600 text-white font-semibold rounded-lg shadow-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-300"
                >
                    수정 완료 및 돌아가기
                </button>
            </div>
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                <div className="xl:col-span-1 bg-white p-4 rounded-2xl shadow-lg h-[90vh] overflow-y-auto">
                   <div className="space-y-6">
                       {scoreCategories.map(category => (
                           <div key={category.name}>
                               <h3 className="text-xl font-bold text-gray-700 mb-3 sticky top-0 bg-white py-2 border-b">{category.name}</h3>
                               <div className="space-y-3">
                                   {category.items.map(key => (
                                       <div key={key} className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-100">
                                           <label htmlFor={key} className="text-sm text-gray-600 flex-1">{QUESTION_MAP[key as keyof typeof QUESTION_MAP]}</label>
                                           <input
                                               type="number"
                                               id={key}
                                               min="3"
                                               max={key.startsWith('B') ? '5' : '7'}
                                               value={editedData.scores[key].score}
                                               onChange={(e) => handleScoreChange(key, e.target.value)}
                                               className="w-16 text-center font-bold text-lg text-indigo-600 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                           />
                                       </div>
                                   ))}
                               </div>
                           </div>
                       ))}
                       
                        {/* Text Editing Section */}
                        <div>
                           <h3 className="text-xl font-bold text-gray-700 mb-3 sticky top-0 bg-white py-2 border-b">총평 및 대표활동 수정</h3>
                           <div className="space-y-4 p-2">
                                <div>
                                    <label className="font-semibold text-gray-600">핵심 역량</label>
                                    <textarea value={editedData.coreCompetency} onChange={(e) => handleTextChange('coreCompetency', e.target.value)} className="w-full h-24 p-2 mt-1 border rounded-md"/>
                                </div>
                                <div>
                                    <label className="font-semibold text-gray-600">주요 강점</label>
                                    <textarea value={editedData.keyStrengths} onChange={(e) => handleTextChange('keyStrengths', e.target.value)} className="w-full h-24 p-2 mt-1 border rounded-md"/>
                                </div>
                                <div>
                                    <label className="font-semibold text-gray-600">보완점 및 제언</label>
                                    <textarea value={editedData.suggestions} onChange={(e) => handleTextChange('suggestions', e.target.value)} className="w-full h-24 p-2 mt-1 border rounded-md"/>
                                </div>
                                {editedData.representativeActivities.map((activity, index) => (
                                    <div key={index} className="space-y-2 border-t pt-4">
                                         <label className="font-semibold text-gray-600">대표 활동 {index + 1}</label>
                                         <input type="text" placeholder="활동 제목" value={activity.title} onChange={e => handleActivityChange(index, 'title', e.target.value)} className="w-full p-2 mt-1 border rounded-md" />
                                         <textarea placeholder="활동 설명" value={activity.description} onChange={e => handleActivityChange(index, 'description', e.target.value)} className="w-full h-20 p-2 mt-1 border rounded-md" />
                                    </div>
                                ))}
                           </div>
                        </div>

                        {/* Inquiry Examples Editing Section */}
                         <div>
                            <h3 className="text-xl font-bold text-gray-700 mb-3 sticky top-0 bg-white py-2 border-b">탐구역량 분석 예시 수정</h3>
                            <div className="space-y-4 p-2">
                                {editedData.inquiryExcellentExamples.map((example, index) => (
                                    <div key={`excellent-edit-${index}`} className="space-y-2 border-t pt-4">
                                        <label className="font-semibold text-gray-600">우수 사례 {index + 1}</label>
                                        <input type="text" placeholder="태그" value={example.tag} onChange={e => handleExcellentExampleChange(index, 'tag', e.target.value)} className="w-full p-2 mt-1 border rounded-md" />
                                        <input type="text" placeholder="제목" value={example.title} onChange={e => handleExcellentExampleChange(index, 'title', e.target.value)} className="w-full p-2 mt-1 border rounded-md" />
                                        <textarea placeholder="설명" value={example.description} onChange={e => handleExcellentExampleChange(index, 'description', e.target.value)} className="w-full h-20 p-2 mt-1 border rounded-md" />
                                    </div>
                                ))}
                                {editedData.inquiryImprovementExample && (
                                    <div className="space-y-2 border-t pt-4">
                                        <label className="font-semibold text-gray-600">보완 필요 사례</label>
                                        <input type="text" placeholder="태그" value={editedData.inquiryImprovementExample.tag} onChange={e => handleImprovementExampleChange('tag', e.target.value)} className="w-full p-2 mt-1 border rounded-md" />
                                        <input type="text" placeholder="제목" value={editedData.inquiryImprovementExample.title} onChange={e => handleImprovementExampleChange('title', e.target.value)} className="w-full p-2 mt-1 border rounded-md" />
                                        <textarea placeholder="설명" value={editedData.inquiryImprovementExample.description} onChange={e => handleImprovementExampleChange('description', e.target.value)} className="w-full h-20 p-2 mt-1 border rounded-md" />
                                    </div>
                                )}
                           </div>
                        </div>

                   </div>
                </div>
                
                <div className="xl:col-span-2 h-[90vh] overflow-y-auto bg-gray-100 rounded-2xl">
                    <ReportDashboard 
                        data={editedData} 
                        onGoToEditor={() => {}}
                        onGoToEvaluator={() => {}}
                        onReset={() => {}}
                        showActions={false}
                    />
                </div>
            </div>
           
        </div>
    );
};

export default ReportEditor;