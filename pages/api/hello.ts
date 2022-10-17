// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';

export default async (
  req: NextApiRequest,
  res: NextApiResponse
) => {
    try {
    const jwLink: any = req.query.link || '';
    const jwURL = 'https://www.jw.org/'+decodeURIComponent(jwLink);

    const jwHTML = await axios.get(jwURL).then(response => response.data);

    res.status(200).json({html: jwHTML, url: jwURL});
  } catch (error) {
    console.log(error)
    res.status(404).end(null);
  }
};

export const config = {
  runtime: 'experimental-edge'
};