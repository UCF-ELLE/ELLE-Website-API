// make me a custom useAxios hook
import { useState, useEffect } from 'react';

import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';

export type UseAxiosProps = {
    url: string;
    method: 'get' | 'post' | 'put' | 'delete' | undefined;
    headers?: AxiosRequestConfig['headers'] | undefined;
    body?: AxiosRequestConfig['data'] | undefined;
    trigger?: boolean | undefined;
};

export type UseAxiosResponse<T> = {
    response: AxiosResponse<T> | undefined;
    error: any;
    loading: boolean;
};

export default function useAxios<T>({
    url,
    method,
    headers,
    body,
    trigger,
}: UseAxiosProps): UseAxiosResponse<T> {
    const [response, setResponse] = useState<AxiosResponse<T>>();
    const [error, setError] = useState<any>();
    const [loading, setLoading] = useState<boolean>(false);

    useEffect(() => {
        const config: AxiosRequestConfig = {
            method,
            url,
            headers,
            data: body,
        };

        setLoading(true);

        axios(config)
            .then((res) => {
                setResponse(res);
                setLoading(false);
            })
            .catch((err) => {
                setError(err);
                setLoading(false);
            });
    }, [body, headers, method, trigger, url]);

    return { response, error, loading };
}
