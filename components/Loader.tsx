
import React from 'react';

const Loader = () => {
    return (
        <div className="flex flex-col items-center justify-center p-8">
            <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-indigo-600"></div>
            <p className="mt-4 text-lg text-gray-700 font-semibold">AI가 학생부를 분석하고 있습니다...</p>
            <p className="mt-1 text-gray-500">잠시만 기다려주세요. 이 과정은 최대 1분 정도 소요될 수 있습니다.</p>
        </div>
    );
};

export default Loader;
