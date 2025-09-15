import React, { useMemo, useRef, useState } from 'react';
import { ResponsiveContainer, BarChart, XAxis, YAxis, Tooltip, Bar, PieChart, Pie, Cell } from 'recharts';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import type { EvaluationResult, CategoryScores, QuestionKey } from '../types';
import { QUESTION_MAP } from '../constants';
import { FileTextIcon, BookOpenIcon } from './icons';
import InquiryExamples from './InquiryExamples';

interface ReportDashboardProps {
    data: EvaluationResult;
    onGoToEditor: () => void;
    onGoToEvaluator: () => void;
    onReset: () => void;
    showActions?: boolean;
}

const colorSchemes = {
    'A': { excellent: '#1e3a8a', strong: '#1d4ed8', medium: '#3b82f6', light: '#93c5fd', weak: '#dbeafe' }, // Blues
    'B': { excellent: '#9a3412', strong: '#c2410c', medium: '#ea580c', light: '#f97316', weak: '#fdba74' }, // Oranges
    'C': { excellent: '#4c1d95', strong: '#5b21b6', medium: '#7c3aed', light: '#a78bfa', weak: '#ddd6fe' }, // Purples
};

const DetailedChart = ({ categoryData, colorScheme }: { categoryData: CategoryScores, colorScheme: typeof colorSchemes['A'] }) => {
    const maxPossibleScore = categoryData.key === 'B' ? 5 : 7;
    
    const getBarColor = (score: number) => {
        if (maxPossibleScore === 7) {
            if (score >= 7) return colorScheme.excellent;
            if (score >= 6) return colorScheme.strong;
            if (score >= 5) return colorScheme.medium;
            if (score >= 4) return colorScheme.light;
            return colorScheme.weak;
        } else { // 5-point scale
            if (score >= 5) return colorScheme.excellent;
            if (score >= 4) return colorScheme.strong;
            return colorScheme.medium; // for score 3
        }
    };

    const domain: [number, number] = [1, maxPossibleScore];
    const ticks = Array.from({ length: maxPossibleScore }, (_, i) => i + 1);

    return (
        <ResponsiveContainer width="100%" height="100%">
            <BarChart data={categoryData.items} layout="vertical" margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
                <XAxis type="number" domain={domain} ticks={ticks} axisLine={false} tickLine={false} tick={{dy: 5}} />
                <YAxis type="category" dataKey="label" width={150} tick={{ fontSize: 12 }} interval={0} axisLine={false} tickLine={false}/>
                <Tooltip
                    cursor={{ fill: 'rgba(238, 242, 255, 0.5)' }}
                    formatter={(value: number, name, props) => [`${value}점`, props.payload.justification]}
                    labelFormatter={(label) => label}
                    contentStyle={{ 
                        backgroundColor: 'rgba(255, 255, 255, 0.9)', 
                        backdropFilter: 'blur(4px)',
                        border: '1px solid #e5e7eb',
                        borderRadius: '0.5rem',
                        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
                        maxWidth: '300px',
                        whiteSpace: 'normal',
                     }}
                />
                <Bar dataKey="score" background={{ fill: '#f3f4f6', radius: 4 }} radius={[0, 4, 4, 0]}>
                    {categoryData.items.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={getBarColor(entry.score)} />
                    ))}
                </Bar>
            </BarChart>
        </ResponsiveContainer>
    );
};


const ReportDashboard = ({ data, onGoToEditor, onGoToEvaluator, onReset, showActions = true }: ReportDashboardProps) => {
    const reportRef = useRef<HTMLDivElement>(null);
    const [isExporting, setIsExporting] = useState(false);
    
    const { categoryData, totalAverage, totalScore, maxScore } = useMemo(() => {
        const categories: Record<string, CategoryScores> = {
            'A': { key: 'A', name: '탐구력', average: 0, totalScore: 0, maxScore: 0, items: [] },
            'B': { key: 'B', name: '자기주도성', average: 0, totalScore: 0, maxScore: 0, items: [] },
            'C': { key: 'C', name: '창의적 문제해결', average: 0, totalScore: 0, maxScore: 0, items: [] },
        };
        
        let grandTotalScore = 0;
        let grandMaxScore = 0;

        for (const key in data.scores) {
            const categoryKey = key.charAt(0);
            if (categories[categoryKey]) {
                const scoreItem = data.scores[key as QuestionKey];
                categories[categoryKey].items.push({
                    id: key,
                    label: QUESTION_MAP[key as keyof typeof QUESTION_MAP].split('(')[0].trim() || 'Unknown',
                    score: scoreItem.score,
                    justification: scoreItem.justification,
                });
                categories[categoryKey].totalScore += scoreItem.score;
                const maxScoreForItem = categoryKey === 'B' ? 5 : 7;
                categories[categoryKey].maxScore += maxScoreForItem;
            }
        }
        
        Object.values(categories).forEach(cat => {
            cat.average = cat.items.length > 0 ? (cat.totalScore / cat.maxScore) * 100 : 0;
            grandTotalScore += cat.totalScore;
            grandMaxScore += cat.maxScore;
        });

        const totalAverage = grandMaxScore > 0 ? (grandTotalScore / grandMaxScore) * 100 : 0;

        return { categoryData: Object.values(categories), totalAverage, totalScore: grandTotalScore, maxScore: grandMaxScore };
    }, [data]);
    
    const mainChartData = categoryData.map(c => ({ name: c.name, '역량 평균 점수': c.average }));
    const MAIN_CHART_COLORS = [colorSchemes['A'].strong, colorSchemes['B'].strong, colorSchemes['C'].strong];
    
    const handleExportPDF = async () => {
        const reportElement = reportRef.current;
        if (!reportElement) return;
        
        setIsExporting(true);
        try {
            const canvas = await html2canvas(reportElement, {
                scale: 2,
                useCORS: true,
                backgroundColor: '#f9fafb'
            });

            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF('p', 'mm', 'a4');
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const imgWidth = canvas.width;
            const imgHeight = canvas.height;
            const ratio = imgWidth / imgHeight;
            let imgHeightOnPdf = pdfWidth / ratio;
            let heightLeft = imgHeightOnPdf;
            let position = 0;

            pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeightOnPdf);
            heightLeft -= pdf.internal.pageSize.getHeight();

            while (heightLeft > 0) {
                position = -heightLeft;
                pdf.addPage();
                pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeightOnPdf);
                heightLeft -= pdf.internal.pageSize.getHeight();
            }

            pdf.save(`${data.studentName}_탐구역량_보고서.pdf`);

        } catch (error) {
            console.error("Error exporting to PDF", error);
        } finally {
            setIsExporting(false);
        }
    };


    return (
      <>
        <div className="container mx-auto" ref={reportRef}>
            {/* Header */}
            <header className="text-center mb-12 p-8 rounded-2xl bg-gradient-to-r from-blue-400 to-cyan-400 shadow-md">
                <h1 className="text-4xl sm:text-5xl font-bold text-white tracking-tight" style={{textShadow: '1px 1px 3px rgba(0,0,0,0.2)'}}>탐구역량 평가</h1>
            </header>

            {/* 종합 평가 */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
                <div className="lg:col-span-2 bg-white rounded-2xl shadow-lg p-6">
                    <h2 className="text-2xl font-bold text-gray-800 mb-4 text-center">핵심 역량 분석</h2>
                    <div className="h-[350px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={mainChartData}>
                                <XAxis dataKey="name" tick={{ fontSize: 14 }} />
                                <YAxis domain={[0, 100]} tickCount={6} />
                                <Tooltip
                                    cursor={{ fill: 'rgba(238, 242, 255, 0.5)' }}
                                    formatter={(value) => [`${(value as number).toFixed(1)}점`, '평균 점수']}
                                />
                                <Bar dataKey="역량 평균 점수" radius={[4, 4, 0, 0]} barSize={60}>
                                    {mainChartData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={MAIN_CHART_COLORS[index % MAIN_CHART_COLORS.length]} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
                <div className="bg-white rounded-2xl shadow-lg p-6 flex flex-col justify-center items-center text-center">
                    <h2 className="text-2xl font-bold text-gray-800 mb-4">종합 평균 점수</h2>
                    <div className="relative w-48 h-48">
                         <ResponsiveContainer width="100%" height="100%">
                             <PieChart>
                                 <Pie
                                     data={[{ value: totalAverage }, { value: 100 - totalAverage }]}
                                     dataKey="value"
                                     cx="50%"
                                     cy="50%"
                                     innerRadius="80%"
                                     outerRadius="100%"
                                     startAngle={90}
                                     endAngle={450}
                                     paddingAngle={0}
                                     stroke="none"
                                 >
                                     <Cell fill={colorSchemes.A.strong} />
                                     <Cell fill="#e5e7eb" />
                                 </Pie>
                             </PieChart>
                         </ResponsiveContainer>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <span className="text-4xl font-bold text-indigo-600">{totalAverage.toFixed(1)}</span>
                            <span className="text-gray-500">/ 100 점</span>
                        </div>
                    </div>
                    <p className="mt-4 text-gray-600">원점수 총합: {totalScore} / {maxScore}</p>
                </div>
            </div>

             {/* 대표 융합 탐구 활동 */}
            {data.representativeActivities && data.representativeActivities.length > 0 && (
                <div className="mb-12">
                    <h2 className="text-xl font-bold text-gray-800 mb-4 text-center">전공 관련 대표 탐구활동</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {data.representativeActivities.map((activity, index) => (
                            <div key={index} className="bg-white rounded-2xl shadow-lg p-6 flex items-start space-x-4">
                                <div className="flex-shrink-0 w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center">
                                    {index % 2 === 0 ? <FileTextIcon /> : <BookOpenIcon />}
                                </div>
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-800">{activity.title}</h3>
                                    <p className="text-gray-600 mt-1">{activity.description}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* 세부 역량 분석 */}
            <div className="mt-12">
                <h2 className="text-2xl font-bold text-gray-800 mb-8 text-center">세부 역량 분석</h2>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {categoryData.map(category => {
                        const colorScheme = colorSchemes[category.key];
                        
                        return (
                            <div key={category.key} className="bg-white rounded-2xl shadow-lg p-6 flex flex-col">
                                <div className="text-center pb-3">
                                    <h3 className="text-lg font-bold text-gray-800">{category.name}</h3>
                                </div>
                                 <div className="border-b border-gray-200 mb-2"></div>
                                <div className="text-center mt-1 mb-2">
                                     <p className={`text-xs font-semibold ${
                                        category.key === 'B' ? 'text-orange-700' : 'text-slate-600'
                                    }`}>
                                        {category.key === 'B' ? '5점 만점 항목' : '7점 만점 항목'}
                                    </p>
                                </div>
                                <div className="flex-grow" style={{ height: `${category.items.length * 40}px`, minHeight: '200px' }}>
                                    <DetailedChart categoryData={category} colorScheme={colorScheme} />
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>


            {/* 탐구역량 분석 예시 */}
            {data.inquiryExcellentExamples && data.inquiryImprovementExample && (
                <InquiryExamples 
                    excellentExamples={data.inquiryExcellentExamples}
                    improvementExample={data.inquiryImprovementExample}
                />
            )}

            {/* 탐구역량 총평 */}
            <div className="bg-white rounded-2xl shadow-lg p-8 mt-12">
                <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">탐구역량 총평</h2>
                <div className="text-gray-700 space-y-4 leading-relaxed text-base">
                    <p>
                        <span className="font-semibold text-indigo-600">[핵심 역량]</span>
                        {' '}{data.coreCompetency}
                    </p>
                    <p>
                        <span className="font-semibold text-indigo-600">[주요 강점]</span>
                        {' '}{data.keyStrengths}
                    </p>
                    <p>
                        <span className="font-semibold text-indigo-600">[보완점 및 제언]</span>
                        {' '}{data.suggestions}
                    </p>
                </div>
            </div>
        </div>

        {showActions && (
            <div className="text-center mt-12 space-x-2 sm:space-x-4">
                <button
                    onClick={handleExportPDF}
                    disabled={isExporting}
                    className="px-4 sm:px-6 py-2 bg-green-600 text-white font-semibold rounded-lg shadow-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors duration-300 disabled:bg-gray-400"
                >
                    {isExporting ? 'PDF 생성 중...' : 'PDF로 내보내기'}
                </button>
                <button
                   onClick={onGoToEvaluator}
                   className="px-4 sm:px-6 py-2 bg-slate-700 text-white font-semibold rounded-lg shadow-md hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500 transition-colors duration-300"
               >
                   평가자용 상세 보기
               </button>
                <button
                   onClick={onGoToEditor}
                   className="px-4 sm:px-6 py-2 bg-indigo-600 text-white font-semibold rounded-lg shadow-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-300"
               >
                   점수 및 내용 수정하기
               </button>
               <button
                   onClick={onReset}
                   className="px-4 sm:px-6 py-2 bg-gray-600 text-white font-semibold rounded-lg shadow-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors duration-300"
               >
                   새 분석 시작
               </button>
           </div>
        )}
      </>
    );
};

export default ReportDashboard;