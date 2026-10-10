import express from 'express';
import { LIMITES } from '../config/constantes.js';

/**
 * Parser JSON com limite por rota. Não há parser global de propósito: o limite padrão é pequeno (32 KB)
 * e só as rotas que recebem fotos aceitam corpos grandes, e sempre DEPOIS de autenticar/limitar taxa.
 * Só `application/json` é lido; qualquer outro tipo deixa `req.body` indefinido e é recusado pelo validador.
 */
export const corpoJson = (limite = LIMITES.corpoPadrao) =>
  express.json({ limit: limite, type: 'application/json', strict: true });
