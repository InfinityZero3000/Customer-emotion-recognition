import os
import json
import logging
from typing import Dict, List, Any, Optional, AsyncGenerator
from datetime import datetime
import asyncio
from dotenv import load_dotenv
from langchain.prompts import ChatPromptTemplate
from langchain.chat_models import ChatOpenAI
from langchain.chains import LLMChain
from langchain.memory import ConversationBufferMemory
from langchain.cache import SQLiteCache
from langchain.globals import set_llm_cache
from langchain_core.runnables import RunnableConfig
from langchain_core.output_parsers import StrOutputParser
from langchain.callbacks.streaming_stdout import StreamingStdOutCallbackHandler
from langgraph.graph import StateGraph
from pydantic import BaseModel, Field

# Load environment variables
load_dotenv()

# Configure logging
logger = logging.getLogger("emotion-agent")

# Configure langchain caching
set_llm_cache(SQLiteCache(database_path=".langchain.db"))

class AgentState(BaseModel):
    """State for the emotion agent graph."""
    user_id: str = Field(description="The ID of the user")
    emotions: Optional[Dict[str, float]] = Field(default=None, description="Current detected emotions")
    previous_interactions: Optional[List[Dict[str, Any]]] = Field(default=None, description="User's previous interactions")
    session_context: Optional[Dict[str, Any]] = Field(default=None, description="Current session context")
    recommended_categories: Optional[List[str]] = Field(default=None, description="Recommended product categories")
    reasoning: Optional[str] = Field(default=None, description="Reasoning behind recommendations")
    confidence_score: Optional[float] = Field(default=None, description="Confidence score of recommendations")

class EmotionAgent:
    """
    An agent that predicts product preferences based on detected emotions.
    Uses LangChain and LangGraph to create a pipeline for emotion analysis.
    """
    def __init__(self):
        # Initialize LLM
        self.llm = ChatOpenAI(
            api_key=os.getenv("OPENAI_API_KEY", "dummy-key"),
            model_name=os.getenv("OPENAI_MODEL_NAME", "gpt-3.5-turbo"),
            streaming=True,
            temperature=0.7
        )
        
        # Initialize memory
        self.memory = ConversationBufferMemory(
            memory_key="chat_history",
            return_messages=True
        )
        
        # Initialize the product categories - in real implementation, these would be fetched from a database
        self.product_categories = [
            "Electronics", "Clothing", "Home & Kitchen", "Beauty & Personal Care",
            "Sports & Outdoors", "Books", "Toys & Games", "Health & Wellness",
            "Jewelry", "Handmade", "Automotive", "Pet Supplies", "Food & Grocery"
        ]
        
        # Build LangGraph
        self.graph = self._build_graph()
        
        logger.info("Emotion Agent initialized successfully")
    
    def _build_graph(self) -> StateGraph:
        """
        Build the LangGraph for emotion processing and product recommendation.
        """
        # Define the workflow
        graph = StateGraph(AgentState)
        
        # Add nodes to the graph
        graph.add_node("analyze_emotion", self._analyze_emotions)
        graph.add_node("generate_recommendations", self._generate_recommendations)
        graph.add_node("calculate_confidence", self._calculate_confidence)
        
        # Define edges
        graph.add_edge("analyze_emotion", "generate_recommendations")
        graph.add_edge("generate_recommendations", "calculate_confidence")
        
        # Set entry point
        graph.set_entry_point("analyze_emotion")
        
        # Compile the graph
        return graph.compile()
    
    async def _analyze_emotions(self, state: AgentState) -> AgentState:
        """
        Analyze the detected emotions to understand user's mood.
        """
        if not state.emotions:
            # Default to neutral if no emotions provided
            state.emotions = {"neutral": 1.0}
        
        # This would typically involve more complex analysis, but for now we'll just use the emotions directly
        return state
    
    async def _generate_recommendations(self, state: AgentState) -> AgentState:
        """
        Generate product category recommendations based on emotions.
        """
        # Define the prompt template
        prompt = ChatPromptTemplate.from_template("""
        You are an AI agent for an e-commerce platform that recommends products based on customer emotions.
        
        Current customer emotions: {emotions}
        Previous customer interactions: {previous_interactions}
        Current session context: {session_context}
        
        Based on these emotions and context, recommend 3-5 product categories from the following list:
        {product_categories}
        
        Also provide a brief reasoning for your recommendations. Format your response as a JSON with:
        - recommended_categories: a list of strings
        - reasoning: a string explaining your reasoning
        
        Response:
        """)
        
        # Create the chain
        chain = prompt | self.llm | StrOutputParser()
        
        # Run the chain
        result = await chain.ainvoke({
            "emotions": state.emotions,
            "previous_interactions": state.previous_interactions or "No previous interactions",
            "session_context": state.session_context or "No session context",
            "product_categories": self.product_categories
        })
        
        # Parse result
        try:
            parsed_result = json.loads(result)
            state.recommended_categories = parsed_result.get("recommended_categories", [])
            state.reasoning = parsed_result.get("reasoning", "")
        except Exception as e:
            logger.error(f"Error parsing recommendation result: {str(e)}")
            # Fall back to default recommendations
            state.recommended_categories = ["Electronics", "Clothing", "Home & Kitchen"]
            state.reasoning = "Default recommendations based on general popularity."
        
        return state
    
    async def _calculate_confidence(self, state: AgentState) -> AgentState:
        """
        Calculate confidence score for the recommendations.
        """
        # In a real implementation, this would be a more sophisticated calculation
        if state.emotions:
            dominant_emotion = max(state.emotions, key=state.emotions.get)
            dominant_score = state.emotions.get(dominant_emotion, 0.5)
            
            # Higher confidence for more expressive emotions (happy, angry, etc.)
            # Lower confidence for neutral
            if dominant_emotion == "neutral":
                state.confidence_score = 0.7 * dominant_score
            elif dominant_emotion in ["happy", "surprise"]:
                state.confidence_score = 0.9 * dominant_score
            else:
                state.confidence_score = 0.8 * dominant_score
        else:
            state.confidence_score = 0.5  # Default confidence
        
        return state
    
    async def predict_preferences(self, 
                             user_id: str, 
                             emotions: Optional[Dict[str, float]] = None,
                             previous_interactions: Optional[List[Dict[str, Any]]] = None,
                             session_context: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """
        Predict product preferences based on user's emotion.
        """
        try:
            # Initialize state
            initial_state = AgentState(
                user_id=user_id,
                emotions=emotions,
                previous_interactions=previous_interactions,
                session_context=session_context
            )
            
            # Run the graph
            final_state = await self.graph.ainvoke(initial_state)
            
            # Return results
            return {
                "user_id": user_id,
                "recommended_categories": final_state.recommended_categories or [],
                "reasoning": final_state.reasoning or "",
                "confidence_score": final_state.confidence_score or 0.5
            }
        except Exception as e:
            logger.error(f"Error predicting preferences: {str(e)}")
            # Return fallback response
            return {
                "user_id": user_id,
                "recommended_categories": ["Electronics", "Clothing", "Home & Kitchen"],
                "reasoning": "Default recommendations due to processing error.",
                "confidence_score": 0.5
            }
    
    async def stream_recommendations(self,
                                 user_id: str,
                                 emotions: Optional[Dict[str, float]] = None,
                                 previous_interactions: Optional[List[Dict[str, Any]]] = None,
                                 session_context: Optional[Dict[str, Any]] = None) -> AsyncGenerator[str, None]:
        """
        Stream product recommendations.
        """
        # Define the prompt template for streaming
        prompt = ChatPromptTemplate.from_template("""
        You are an AI agent for an e-commerce platform that recommends products based on customer emotions.
        
        Current customer emotions: {emotions}
        Previous customer interactions: {previous_interactions}
        Current session context: {session_context}
        
        Based on these emotions and context, recommend 3-5 product categories from the following list:
        {product_categories}
        
        For each recommended category, provide a detailed explanation of why it's relevant to the customer's current emotional state.
        
        Format each recommendation as a JSON object with:
        - category: the name of the product category
        - explanation: why this category is recommended
        - confidence: a value between 0 and 1
        
        Send one recommendation at a time.
        """)
        
        # Create chain
        chain = prompt | self.llm
        
        try:
            # Create runnable config for streaming
            config = RunnableConfig(callbacks=[StreamingStdOutCallbackHandler()])
            
            # Initialize streaming results
            stream_results = []
            
            # Run the chain
            async for chunk in chain.astream({
                "emotions": emotions or {"neutral": 1.0},
                "previous_interactions": previous_interactions or "No previous interactions",
                "session_context": session_context or "No session context",
                "product_categories": self.product_categories
            }, config=config):
                content = chunk.content if hasattr(chunk, 'content') else str(chunk)
                stream_results.append(content)
                
                # Yield each chunk as it becomes available
                yield content
        except Exception as e:
            logger.error(f"Error streaming recommendations: {str(e)}")
            # Yield an error message
            yield json.dumps({
                "error": "Error generating streaming recommendations",
                "details": str(e)
            })
    
    async def get_emotion_stats(self, user_id: str, timeframe: str) -> Dict[str, Any]:
        """
        Get emotion statistics for a user over a specified timeframe.
        In a real implementation, this would fetch data from a database.
        """
        # Mock statistics for demonstration
        stats = {
            "user_id": user_id,
            "timeframe": timeframe,
            "period_start": (datetime.now().isoformat() if timeframe == "daily" else 
                            (datetime.now().replace(day=1).isoformat() if timeframe == "monthly" else
                             datetime.now().replace(day=datetime.now().day - datetime.now().weekday()).isoformat())),
            "period_end": datetime.now().isoformat(),
            "emotion_distribution": {
                "happy": 0.45,
                "neutral": 0.25,
                "surprise": 0.15,
                "sad": 0.05,
                "angry": 0.05,
                "disgust": 0.03,
                "fear": 0.02
            },
            "product_interactions": [
                {"category": "Electronics", "interaction_count": 12, "correlation_with_emotion": "happy"},
                {"category": "Clothing", "interaction_count": 8, "correlation_with_emotion": "neutral"},
                {"category": "Home & Kitchen", "interaction_count": 5, "correlation_with_emotion": "happy"}
            ]
        }
        
        return stats