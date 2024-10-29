import React, { useEffect, useState } from 'react';

type Icon = {
  id: number;
  name: string;
  icon: string;
};

export default function IconList() {
  const [icons, setIcons] = useState<Icon[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [added, setAdded] = useState<boolean>(false);

  useEffect(() => {
    async function fetchIcons() {
      try {
        const response = await fetch('/api/icons');
        if (!response.ok) {
          throw new Error('Network response was not ok.');
        }
        const data = await response.json();

        if (!Array.isArray(data)) {
          throw new Error('Invalid data format');
        }

        setIcons(data);
      } catch (error) {
        console.error('Error fetching icons:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchIcons();
  }, []);

  async function postIcon() {
    const newIcon = {
      name: `Sample Icon ${icons.length + 1}`,
      icon: 'x',
    }
    try {
      // Making the POST request to your API endpoint
      const response = await fetch('/api/icons', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newIcon), // Send the new icon data in the request body
      });

      // Check if the response is successful
      if (!response.ok) {
        throw new Error('Failed to post new icon');
      }

      // Parsing the response data
      const result = await response.json();
      console.log('Successfully posted:', result);

      // Optionally update the state with the result, e.g., add the new icon to the list
      setIcons((prevIcons) => [...prevIcons, result]);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }


  if (loading) {
    return <div>Loading...</div>;
  }

  if (icons.length === 0) {
	  return <></>;
  }

  const RenderIcons = () => {
    console.log(icons);
    return <>
      <ul>
        {icons.map((icon, index) => (
          <li key={index}>{icon.name} - {icon.icon}</li>
        ))}
      </ul>
      </>;
  }

  return (
    <div>
      <h1>Icons</h1>
      {RenderIcons()}
      <button onClick={postIcon} > Add Icon </button>
    </div>
  );
}
