// const baseUrl = 'http://localhost:4000/api/rest/create';
const baseUrl = 'https://funwithlimbo.appspot.com/api/rest/create';

function objectToQueryString(obj: any) {
  return Object.keys(obj).map(key => key + '=' + obj[key]).join('&');
}

export async function createFinalVideo(id: string, params: CreateVideoParams) {
  try {
    const url = `${baseUrl}/${id}?${objectToQueryString(params)}`;
    const options = {
      method: 'GET',
      //   headers: { Authorization: `${idToken}` }
      responseType: 'blob'
    };
    const res = await fetch(url, options);
    return res.blob();
  } catch(err) {
    throw err;
  }
}

interface CreateVideoParams { 
  size: number[];
  framesCount: number;
  facePaths: string[];
}
