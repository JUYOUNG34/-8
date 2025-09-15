
import React from 'react';
import type { InquiryExample } from '../types';

const CaseCard = ({ type, tag, title, description }: { type: string; tag: string; title: string; description: string }) => {
    const isExcellent = type === 'excellent';
    
    const borderColor = isExcellent ? 'border-blue-300' : 'border-red-300';
    const titleColor = isExcellent ? 'text-blue-700' : 'text-red-700';
    const tagBgColor = isExcellent ? 'bg-blue-100' : 'bg-red-100';
    const tagTextColor = isExcellent ? 'text-blue-800' : 'text-red-800';

    return (
        <div className={`p-4 border ${borderColor} rounded-lg bg-white`}>
            <div className="flex justify-between items-start mb-2 gap-4">
                <h3 className={`font-bold text-base ${titleColor}`}>{title}</h3>
                <span className={`text-xs font-semibold px-3 py-1 rounded-full whitespace-nowrap ${tagBgColor} ${tagTextColor}`}>
                    {tag}
                </span>
            </div>
            <p className="text-sm text-gray-700 leading-relaxed">{description}</p>
        </div>
    );
};

interface InquiryExamplesProps {
    excellentExamples: InquiryExample[];
    improvementExample: InquiryExample;
}

const InquiryExamples = ({ excellentExamples, improvementExample }: InquiryExamplesProps) => {
    return (
        <div className="mt-12">
            <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">탐구역량 분석 예시</h2>
            <div className="space-y-4">
                {excellentExamples.map((ex, index) => (
                    <CaseCard 
                        key={`excellent-${index}`}
                        type="excellent"
                        tag={ex.tag}
                        title={ex.title}
                        description={ex.description}
                    />
                ))}
                {improvementExample && (
                    <CaseCard
                        type="improvement"
                        tag={improvementExample.tag}
                        title={improvementExample.title}
                        description={improvementExample.description}
                    />
                )}
            </div>
        </div>
    );
};

export default InquiryExamples;
