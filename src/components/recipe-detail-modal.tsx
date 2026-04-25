'use client';

import { useRef, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatCurrency, UNIT_LABELS, calculateRecipeCosts } from '@/lib/utils';
import type { Recipe, Ingredient } from '@/lib/types';
import { Separator } from "./ui/separator";
import { Button } from "./ui/button";
import { FileDown, Share2, Loader2, Info } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useToast } from "@/hooks/use-toast";
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface RecipeDetailModalProps {
  recipe: Recipe | null;
  ingredients: Ingredient[];
  recipes: Recipe[];
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

export function RecipeDetailModal({ recipe, ingredients, recipes, isOpen, setIsOpen }: RecipeDetailModalProps) {
  const { toast } = useToast();
  const pdfContentRef = useRef<HTMLDivElement>(null);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  if (!recipe) return null;

  const { totalCost, salePrice, profitValue, ingredientsCost, frostingCost, frostingName, frostingsDetails } = calculateRecipeCosts(recipe, ingredients, recipes);

  const itemsWithCost = recipe.items.map(item => {
    const ingredient = ingredients.find(i => i.id === item.ingredientId);
    let cost = 0;
    if (ingredient && ingredient.price && ingredient.packageQuantity) {
      cost = (ingredient.price / ingredient.packageQuantity) * item.baseQuantity;
    }
    return { ...item, cost };
  });

  const variableCostValue = (ingredientsCost + frostingCost) * (recipe.variableCostsPercentage / 100);

  const formatDate = (dateString: string) => {
    try {
      if (!dateString) return "Data não disponível";
      return format(parseISO(dateString), "'Salva em' dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
    } catch (e) {
      return `Salva em ${dateString || 'data desconhecida'}`;
    }
  }

  const generatePDFBlob = async (): Promise<Blob | null> => {
    if (!pdfContentRef.current) return null;
    
    setIsGeneratingPDF(true);
    try {
      // Pequeno atraso para garantir que tudo esteja renderizado
      await new Promise(resolve => setTimeout(resolve, 400));
      
      const element = pdfContentRef.current;
      const canvas = await html2canvas(element, {
        scale: 2, // Melhor qualidade
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        // Garante que capture todo o conteúdo mesmo com scroll
        windowHeight: element.scrollHeight,
        windowWidth: element.scrollWidth,
        scrollY: -window.scrollY // Previne desalinhamento se houver scroll na página
      });
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgProps = pdf.getImageProperties(imgData);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
      const pageHeight = pdf.internal.pageSize.getHeight();
      
      let heightLeft = pdfHeight;
      let position = 0;

      // Adiciona a primeira página
      pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, pdfHeight);
      heightLeft -= pageHeight;

      // Adiciona páginas subsequentes se necessário
      while (heightLeft > 0) {
        position -= pageHeight; // Move o "viewport" do PDF para baixo na imagem
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, pdfHeight);
        heightLeft -= pageHeight;
      }

      return pdf.output('blob');
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      toast({ 
        title: 'Erro', 
        description: 'Não foi possível gerar o PDF da receita.', 
        variant: 'destructive' 
      });
      return null;
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const handleDownloadPDF = async () => {
    const blob = await generatePDFBlob();
    if (blob) {
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Receita_${recipe.name.replace(/\s+/g, '_')}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast({ title: 'Sucesso!', description: 'PDF baixado com sucesso.' });
    }
  };

  const handleSharePDF = async () => {
    const blob = await generatePDFBlob();
    if (!blob) return;

    const file = new File([blob], `Receita_${recipe.name.replace(/\s+/g, '_')}.pdf`, { type: 'application/pdf' });
    
    if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({
          files: [file],
          title: `Receita: ${recipe.name}`,
          text: `Confira os custos da receita: ${recipe.name}`
        });
      } catch (error) {
        if ((error as any).name !== 'AbortError') {
          console.error('Erro ao compartilhar:', error);
          toast({ title: 'Atenção', description: 'O seu navegador não suporta o compartilhamento de arquivos PDF. Copiando texto como fallback.' });
          fallbackShareText();
        }
      }
    } else {
      fallbackShareText();
    }
  };

  const fallbackShareText = () => {
    let frostingPart = '';
    if (frostingsDetails && frostingsDetails.length > 0) {
      frostingPart = '\n\nCoberturas:\n' + frostingsDetails.map(f => `- ${f.quantity}x ${f.name} (${formatCurrency(f.cost)})`).join('\n');
    } else if (frostingCost > 0) {
      frostingPart = `\n\nCobertura: ${frostingName} (${formatCurrency(frostingCost)})`;
    }

    const shareableText = `
Receita: ${recipe.name}

Ingredientes:
${recipe.items.map(i => `- ${i.ingredientName}: ${i.displayQuantity} ${UNIT_LABELS[i.displayUnit].split(' ')[0]}`).join('\n')}${frostingPart}

Custo Total: ${formatCurrency(totalCost)}
Preço de Venda Sugerido: ${formatCurrency(salePrice)}
`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(shareableText.trim());
      toast({ title: 'Copiado!', description: 'Texto da receita copiado para a área de transferência.' });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <div className="flex justify-between items-start mr-8">
            <div>
              <DialogTitle className="font-headline text-2xl text-primary">{recipe.name}</DialogTitle>
              <DialogDescription>{formatDate(recipe.createdAt)}</DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="max-h-[60vh] overflow-y-auto pr-4 space-y-6">
          {/* Container para o PDF (será capturado pelo html2canvas) */}
          <div ref={pdfContentRef} className="p-4 bg-white text-slate-900 rounded-lg space-y-6">
            <div className="border-b pb-4">
               <h2 className="text-xl font-bold text-pink-600">{recipe.name}</h2>
               <p className="text-xs text-muted-foreground">{formatDate(recipe.createdAt)}</p>
            </div>

            <div>
              <h3 className="font-semibold mb-2">Ingredientes da Massa</h3>
              <div className="relative overflow-x-auto border rounded-md">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50">
                      <TableHead className="font-bold">Item</TableHead>
                      <TableHead className="font-bold">Qtd.</TableHead>
                      <TableHead className="text-right font-bold">Custo</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {itemsWithCost.map(item => (
                      <TableRow key={item.id}>
                        <TableCell className="whitespace-nowrap">{item.ingredientName}</TableCell>
                        <TableCell className="text-muted-foreground whitespace-nowrap">{item.displayQuantity} {UNIT_LABELS[item.displayUnit].split(' ')[0]}</TableCell>
                        <TableCell className="text-right font-semibold whitespace-nowrap">{formatCurrency(item.cost)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-2">Resumo Financeiro</h3>
              <div className="space-y-2 text-sm p-4 bg-slate-50 border rounded-lg">
                <div className="flex justify-between">
                  <span>Custo da Massa</span>
                  <span className="font-medium">{formatCurrency(ingredientsCost)}</span>
                </div>
                {frostingsDetails && frostingsDetails.length > 0 ? (
                  frostingsDetails.map((f, i) => (
                    <div key={i} className="flex justify-between">
                      <span>Cobertura ({f.quantity}x {f.name})</span>
                      <span className="font-medium">{formatCurrency(f.cost)}</span>
                    </div>
                  ))
                ) : frostingCost > 0 ? (
                   <div className="flex justify-between">
                      <span>Cobertura ({frostingName || '...'})</span>
                      <span className="font-medium">{formatCurrency(frostingCost)}</span>
                  </div>
                ) : null}
                <div className="flex justify-between">
                  <span>Custos Variáveis ({recipe.variableCostsPercentage}%)</span>
                  <span className="font-medium">{formatCurrency(variableCostValue)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Embalagem</span>
                  <span className="font-medium">{formatCurrency(recipe.packagingCost)}</span>
                </div>
                <Separator className="my-2 bg-slate-200" />
                <div className="flex justify-between font-bold text-base">
                  <span className="text-slate-700">CUSTO TOTAL</span>
                  <span className="text-pink-600">{formatCurrency(totalCost)}</span>
                </div>
              </div>
            </div>
            
            <div className="bg-green-50 border border-green-200 p-4 rounded-lg flex flex-col sm:flex-row justify-between items-center gap-4 relative">
              <div className="text-center sm:text-left">
                <p className="text-xs text-green-700 font-bold uppercase">{recipe.fixedSalePrice && recipe.fixedSalePrice > 0 ? "Preço de Venda Praticado" : "Preço de Venda Sugerido"}</p>
                <p className="text-xs text-green-600">{recipe.fixedSalePrice && recipe.fixedSalePrice > 0 ? "(Definido Manualmente)" : `(${recipe.pricingMethod === 'margin' ? 'Margem Real' : 'Markup'} de ${recipe.profitMargin}%)`}</p>
              </div>
              <div className="flex items-center gap-4">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm" className="h-8 text-xs font-semibold text-slate-600 bg-white hover:bg-slate-50 border-green-200">
                      <Info className="w-3.5 h-3.5 mr-1 text-blue-500" />
                      Ver CMV
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-80 p-4" align="end">
                    <div className="space-y-2">
                      <h4 className="font-bold text-sm text-slate-800">Custo da Mercadoria Vendida (CMV)</h4>
                      <p className="text-xs text-slate-600">
                        O CMV indica quanto do seu preço de venda está sendo consumido pelos custos de produção.
                      </p>
                      <div className="bg-slate-50 p-3 rounded-md border text-sm mt-2">
                        <div className="flex justify-between mb-1">
                          <span className="text-slate-500">Custo Total:</span>
                          <span className="font-semibold">{formatCurrency(totalCost)}</span>
                        </div>
                        <div className="flex justify-between mb-2">
                          <span className="text-slate-500">Venda:</span>
                          <span className="font-semibold">{formatCurrency(salePrice)}</span>
                        </div>
                        <div className="flex justify-between pt-2 border-t font-bold">
                          <span>Seu CMV:</span>
                          <span className={salePrice > 0 && (totalCost / salePrice) * 100 > 35 ? "text-red-500" : "text-green-600"}>
                            {salePrice > 0 ? ((totalCost / salePrice) * 100).toFixed(1) : '0'}%
                          </span>
                        </div>
                      </div>
                      <p className="text-[10px] text-muted-foreground pt-1 italic">
                        * O ideal na confeitaria é manter o CMV entre 25% e 35%.
                      </p>
                    </div>
                  </PopoverContent>
                </Popover>
                <div className="flex flex-col items-end">
                  <p className="text-2xl font-bold text-green-700">{formatCurrency(salePrice)}</p>
                  <p className="text-xs font-semibold text-green-600 mt-0.5">Lucro: {formatCurrency(profitValue)}</p>
                </div>
              </div>
            </div>
            
            <div className="text-[10px] text-center text-slate-400 pt-4 italic border-t">
               Gerado por Doce Estimativa - Gestão Profissional de Custos
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
            <Button 
              onClick={handleDownloadPDF} 
              variant="outline" 
              className="w-full"
              disabled={isGeneratingPDF}
            >
              {isGeneratingPDF ? <Loader2 className="animate-spin" /> : <FileDown />}
              Baixar em PDF
            </Button>
            <Button 
              onClick={handleSharePDF} 
              variant="default" 
              className="w-full"
              disabled={isGeneratingPDF}
            >
              {isGeneratingPDF ? <Loader2 className="animate-spin" /> : <Share2 />}
              Compartilhar PDF
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}