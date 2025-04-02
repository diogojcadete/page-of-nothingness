
import { Link } from "react-router-dom";

const Index = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">Welcome to Your Blank App</h1>
        <p className="text-xl text-gray-600 mb-6">Start building your amazing project here!</p>
        <Link 
          to="/blank" 
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
        >
          Go to Blank Page
        </Link>
      </div>
    </div>
  );
};

export default Index;
