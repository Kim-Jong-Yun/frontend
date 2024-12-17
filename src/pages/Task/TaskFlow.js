import React, { useState, forwardRef, useImperativeHandle } from 'react';
import './TaskFlow.css';
import CreateTaskFlow from './CreateTaskFlow';

const TaskFlow = forwardRef(({ workflow, onTemporaryFlowAdd, onTemporaryFlowDelete, taskId }, ref) => {
    const [isPopupOpen, setIsPopupOpen] = useState(false);
    const [temporaryWorkflow, setTemporaryWorkflow] = useState([]);
    const [hiddenFlows, setHiddenFlows] = useState(new Set());

    const togglePopup = () => setIsPopupOpen((prev) => !prev);

    const handleTaskFlowAdd = (nodeName, stepName, x, y) => {
        if (!nodeName.trim() || !stepName.trim()) return;

        const newFlow = { node: nodeName, step: stepName, x, y };
        setTemporaryWorkflow((prev) => [...prev, newFlow]);
        onTemporaryFlowAdd(newFlow);
        togglePopup();
    };

    const handleRemoveFlow = (index, flowId) => {
        setHiddenFlows((prev) => new Set(prev).add(index));
        onTemporaryFlowDelete(taskId, flowId);
    };

    // 외부에서 임시 워크플로우를 초기화할 수 있도록 메서드 제공
    useImperativeHandle(ref, () => ({
        clearTemporaryWorkflow() {
            setTemporaryWorkflow([]);
            setHiddenFlows(new Set());
        }
    }));

    return (
        <div className="task-flow-container">
            <div className="task-flow-background">
                <div className="task-flow-list">
                    {workflow.concat(temporaryWorkflow).map((flow, index) => {
                        const isTemporary = index >= workflow.length;
                        if (hiddenFlows.has(index - workflow.length)) return null;
                        return (
                            <div
                                key={index}
                                className={`task-flow-item ${isTemporary ? 'temporary' : ''}`}
                            >
                                <div><strong>{flow.node}</strong></div> {/* 첫 줄에 노드 이름 */}
                                <div>{flow.step}</div> {/* 두 번째 줄에 단계 */}
                                {flow.x !== undefined && flow.y !== undefined && (
                                    <div className="flow-coordinates">({flow.x.toFixed(2)}, {flow.y.toFixed(2)})</div>
                                )}
                                {!isTemporary && (
                                    <button
                                        className="task-flow-remove-btn"
                                        onClick={() => handleRemoveFlow(index - workflow.length, flow._id)}
                                    >
                                        ×
                                    </button>
                                )}
                            </div>
                        );
                    })}
                    <div className="task-flow-add">
                        <button onClick={togglePopup} className="task-flow-button">+</button>
                    </div>
                </div>
            </div>
            {isPopupOpen && (
                <div className="popup-overlay">
                    <div className="popup-content">
                        <CreateTaskFlow onClose={togglePopup} onTaskFlowAdd={handleTaskFlowAdd} />
                    </div>
                </div>
            )}
        </div>
    );
});

export default TaskFlow;
