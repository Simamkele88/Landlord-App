import { useParams } from "react-router-dom";

// reading id in the detail page
function PropertyDetailsDashboard({properties}){
     const { id } = useParams();
     
     const property = properties.find(p => p.id === Number(id));
     console.log(property);

     if(!property) return <p>Property Not found</p>;
    
     return(
        <div className="p-6 text-gray-900 dark:text-white">
            <h1 className="text-2xl font-bold mb-4">{property.name}</h1>
            <p>Units: {property.units} </p>
            <p>Tenants: {property.totalTenant}</p>
            <p>Location {property.Located}</p>
        </div>
    );

}

export default PropertyDetailsDashboard;