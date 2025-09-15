
import { GoogleGenAI, Type } from "@google/genai";
import { EVALUATION_PROMPT, QUESTION_MAP } from '../constants';
import type { EvaluationResult } from '../types';

if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const scoreItemSchema = {
    type: Type.OBJECT,
    properties: {
        score: {
            type: Type.INTEGER,
            description: "The evaluation score for the item, following the specified scoring rubric (3-7 for 7-point items, 3-5 for 5-point items)."
        },
        justification: {
            type: Type.STRING,
            description: "Meticulous, evidence-based justification for the score, citing specific examples from the report. MUST BE AT LEAST 200 KOREAN CHARACTERS. This is for a professional evaluator's review. (Korean)"
        }
    },
    required: ['score', 'justification']
};

const scoresProperties = Object.keys(QUESTION_MAP).reduce((acc: Record<string, object>, key) => {
    acc[key] = scoreItemSchema;
    return acc;
}, {});

const inquiryExampleProperties = {
    tag: { type: Type.STRING, description: "The relevant school subject or activity context (e.g., '2학년 확률과 통계', '자율활동'). (Korean)" },
    title: { type: Type.STRING, description: "A concise, impactful title for the example. For excellent cases, start with '[우수 사례 N]'. For improvement cases, start with '[보완 필요 사례]'. (Korean)" },
    description: { type: Type.STRING, description: "활동에 대한 상세한 설명. 해당 활동이 왜 우수한 혹은 보완이 필요한 탐구 사례인지 설명함. 우수 사례의 경우, 높은 점수를 받은 근거를 서술하되, 'A3(과정의 우수성)'과 같은 평가 항목 코드를 직접적으로 언급하지 말 것. '학생은 ~' 과 같은 서술을 피하고, 간결하고 객관적인 문체(음슴체)로 작성할 것. (Korean)" }
};

const responseSchema = {
    type: Type.OBJECT,
    properties: {
        scores: {
            type: Type.OBJECT,
            properties: scoresProperties,
            required: Object.keys(QUESTION_MAP)
        },
        studentName: {
            type: Type.STRING,
            description: "The name of the student found in the report. If not found, use '학생'."
        },
        tagline: {
            type: Type.STRING,
            description: "A short, catchy tagline summarizing the student's core identity as a learner. e.g., '융합적 사고와 실천적 탐구를 통해 스스로 지식을 창출하는 인재'. (Korean)"
        },
        coreCompetency: {
            type: Type.STRING,
            description: "A detailed paragraph for the '[핵심 역량]' section. Summarize the student's core inquiry competency. Write in a concise, declarative style (음슴체). Do not start with the student's name. (Korean)"
        },
        keyStrengths: {
            type: Type.STRING,
            description: "A detailed paragraph for the '[주요 강점]' section. Describe the student's key strengths with specific examples. This corresponds to high-scoring items. Write in a concise, declarative style (음슴체). (Korean)"
        },
        suggestions: {
            type: Type.STRING,
            description: "A detailed paragraph for the '[보완점 및 제언]' section. Provide constructive feedback. This corresponds to low-scoring items. Write in a concise, declarative style (음슴체). (Korean)"
        },
        representativeActivities: {
            type: Type.ARRAY,
            description: "Extract two most impressive and representative inquiry activities from the report. (Korean)",
            items: {
                type: Type.OBJECT,
                properties: {
                    title: { type: Type.STRING, description: "Provide the activity title in a concise, declarative style (음슴체). (Korean)" },
                    description: { type: Type.STRING, description: "Provide the activity description in a concise, declarative style (음슴체). (Korean)" }
                },
                required: ['title', 'description']
            }
        },
        inquiryExcellentExamples: {
            type: Type.ARRAY,
            description: "Extract exactly 4 of the most impressive 'Excellent Cases' of inquiry from the report, based on the highest-scoring items. These examples must showcase the student's inquiry competency. (Korean)",
            items: {
                type: Type.OBJECT,
                properties: inquiryExampleProperties,
                required: ['tag', 'title', 'description']
            }
        },
        inquiryImprovementExample: {
            type: Type.OBJECT,
            description: "Identify one key area for improvement in inquiry skills, based on lower-scoring items. Frame it constructively as a 'Case Needing Improvement'. (Korean)",
            properties: inquiryExampleProperties,
            required: ['tag', 'title', 'description']
        }
    },
    required: ['scores', 'studentName', 'tagline', 'coreCompetency', 'keyStrengths', 'suggestions', 'representativeActivities', 'inquiryExcellentExamples', 'inquiryImprovementExample']
};


export const analyzeStudentReport = async (reportText: string): Promise<EvaluationResult> => {
    const fullPrompt = `${EVALUATION_PROMPT}\n\n--- Student Report ---\n${reportText}`;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: fullPrompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: responseSchema,
                temperature: 0.1,
            }
        });

        const jsonText = response.text.trim();
        const result = JSON.parse(jsonText) as EvaluationResult;

        if (!result.scores || !result.tagline || !result.coreCompetency || !result.inquiryExcellentExamples || !result.inquiryImprovementExample) {
            throw new Error("Invalid JSON structure received from API.");
        }
        
        return result;

    } catch (error) {
        console.error("Error analyzing report with Gemini API:", error);
        if (error instanceof Error) {
             throw new Error(`Failed to analyze report: ${error.message}`);
        }
        throw new Error("An unknown error occurred during analysis.");
    }
};