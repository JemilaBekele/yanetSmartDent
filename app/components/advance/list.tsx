'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'react-toastify';
import axios from 'axios';

interface AdvancePaymentFormValues {
  patientId: string;
  amount: number;
}

interface Patient {
  _id: string;
  firstname: string;
  cardno: string;
  price: number;
  Advance: number;
  phoneNumber?: string;
}

interface AdvancePaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  patientId?: string;
  onSuccess?: () => void;
}

export const AdvancePaymentModal: React.FC<AdvancePaymentModalProps> = ({
  isOpen,
  onClose,
  patientId,
  onSuccess,
}) => {
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [patientData, setPatientData] = useState<Patient | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [inputValue, setInputValue] = useState<string>('');

  const { register, handleSubmit, reset, watch, setValue, formState: { errors } } =
    useForm<AdvancePaymentFormValues>({
      defaultValues: {
        patientId: '',
        amount: 0,
      },
    });

  const amount = watch('amount');

  // Fetch patient data when modal opens or patientId changes
  useEffect(() => {
    const fetchPatientData = async () => {
      if (!isOpen || !patientId) {
        setPatientData(null);
        setFetchError(null);
        return;
      }

      try {
        setLoading(true);
        setFetchError(null);
        
        const response = await axios.get(`/api/patient/registerdata/${patientId}`);
        console.log('API Response:', response.data);
        
        if (response.data) {
          const patient = response.data;
          setPatientData({
            _id: patient._id,
            firstname: patient.firstname,
            cardno: patient.cardno,
            price: patient.price || 0,
            Advance: patient.Advance || 0,
            phoneNumber: patient.phoneNumber,
          });
          setValue('patientId', patient._id);
        } else {
          setFetchError('Failed to fetch patient data - no data returned');
        }
      } catch (error: any) {
        console.error('Error fetching patient data:', error);
        const errorMessage = error.response?.data?.message || 
                           error.response?.data?.error || 
                           'Failed to load patient information';
        setFetchError(errorMessage);
        toast.error('Failed to load patient data');
      } finally {
        setLoading(false);
      }
    };

    if (isOpen && patientId) {
      fetchPatientData();
    } else {
      setPatientData(null);
      setFetchError(null);
      reset();
      setInputValue('');
    }
  }, [isOpen, patientId, reset, setValue]);

  // Helper function to safely convert and clean amount
  const cleanAmount = (value: any): number => {
    if (typeof value === 'string') {
      // Remove leading zeros and convert to number
      const cleaned = value.replace(/^0+/, '');
      return cleaned === '' ? 0 : parseFloat(cleaned);
    }
    return Number(value) || 0;
  };

  const onSubmit = async (values: AdvancePaymentFormValues) => {
    if (!patientData) return;

    try {
      setProcessing(true);

      // Use the cleaned amount
      const cleanAmountValue = cleanAmount(values.amount);

      const response = await axios.patch('/api/advance', {
        patientId: values.patientId,
        amount: cleanAmountValue,
      });

      if (response.data.success) {
        toast.success('Payment added to advance successfully!');
        
        setPatientData(prev => prev ? {
          ...prev,
          Advance: response.data.data.newAdvance,
        } : null);
        
        if (response.data.data.isPaymentComplete) {
          toast.success('🎉 Patient has completed all payments!');
        }
        
        reset();
        setInputValue('');
        onClose();
        if (onSuccess) onSuccess();
      } else {
        toast.error(response.data.message || 'Failed to process payment');
      }
    } catch (error: any) {
      console.error('Error processing payment:', error);
      toast.error(error.response?.data?.message || 'Failed to process payment');
    } finally {
      setProcessing(false);
    }
  };

  // Calculate remaining balance (price - advance)
  const calculateRemainingBalance = () => {
    if (!patientData) return 0;
    return Math.max(0, (patientData.price || 0) - (patientData.Advance || 0));
  };

  // Calculate new advance after payment (ADD amount)
  const calculateNewAdvance = () => {
    if (!patientData || !amount) return patientData?.Advance || 0;
    return (patientData.Advance || 0) + amount;
  };

  // Calculate new balance after payment
  const calculateNewBalance = () => {
    if (!patientData || !amount) return calculateRemainingBalance();
    return Math.max(0, (patientData.price || 0) - calculateNewAdvance());
  };

  // Check if payment is complete (advance >= price)
  const isPaymentComplete = () => {
    if (!patientData) return false;
    return (patientData.Advance || 0) >= (patientData.price || 0);
  };

  // Check if payment will be complete after this transaction
  const willPaymentBeComplete = () => {
    if (!patientData || !amount) return false;
    return calculateNewAdvance() >= (patientData.price || 0);
  };

  // Calculate how much of the price is covered by advance
  const calculateAdvanceCoverage = () => {
    if (!patientData) return 0;
    return Math.min(patientData.Advance || 0, patientData.price || 0);
  };

  // Calculate excess advance (advance beyond price)
  const calculateExcessAdvance = () => {
    if (!patientData) return 0;
    return Math.max(0, (patientData.Advance || 0) - (patientData.price || 0));
  };

  const handleFullPayment = () => {
    if (patientData) {
      const remainingBalance = calculateRemainingBalance();
      if (remainingBalance > 0) {
        setValue('amount', remainingBalance);
        setInputValue(remainingBalance.toString());
      }
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    
    // Remove leading zeros
    const cleanedValue = value.replace(/^0+/, '');
    setInputValue(cleanedValue === '' ? '' : cleanedValue);
    
    // Update form value as number
    const numValue = cleanedValue === '' ? 0 : parseFloat(cleanedValue);
    setValue('amount', numValue);
  };

  const handleClose = () => {
    setPatientData(null);
    setFetchError(null);
    reset();
    setInputValue('');
    onClose();
  };

  return (
    <Modal
      title="Add Payment to Advance"
      description="Add payment to patient's advance amount"
      isOpen={isOpen}
      onClose={handleClose}
      size="md"
    >
      <div className="space-y-6">
        {/* Loading State */}
        {loading && (
          <div className="flex justify-center items-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <span className="ml-2">Loading patient data...</span>
          </div>
        )}

        {/* Error State */}
        {fetchError && !loading && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="pt-6">
              <div className="text-center text-red-600">
                <p className="font-medium">Failed to load patient</p>
                <p className="text-sm mt-1">{fetchError}</p>
                <p className="text-xs mt-2 text-red-500">
                  Patient ID: {patientId}
                </p>
                <Button 
                  variant="outline" 
                  className="mt-3"
                  onClick={handleClose}
                >
                  Close
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* No Patient Selected */}
        {!patientId && !loading && (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center text-muted-foreground">
                <p>No patient selected</p>
                <p className="text-sm mt-1">Please select a patient to proceed</p>
                <Button 
                  variant="outline" 
                  className="mt-3"
                  onClick={handleClose}
                >
                  Close
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Patient Information Card */}
        {patientData && !loading && (
          <>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex justify-between items-center">
                  <span>Patient Information</span>
                  <div className="flex gap-2">
                    <Badge 
                      variant={isPaymentComplete() ? "default" : "secondary"}
                      className={isPaymentComplete() ? "bg-green-100 text-green-800" : ""}
                    >
                      {isPaymentComplete() ? 'Paid Fully' : `Advance: $${patientData.Advance}`}
                    </Badge>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <Label className="text-muted-foreground">Name</Label>
                    <p className="font-medium">{patientData.firstname}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Card No</Label>
                    <p className="font-medium">{patientData.cardno}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Total Price</Label>
                    <p className="font-medium">${patientData.price}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Current Advance</Label>
                    <p className="font-medium text-green-600">${patientData.Advance}</p>
                  </div>
                </div>
                
                {/* Payment Status Overview */}
                <div className="grid grid-cols-2 gap-4 pt-3 border-t">
                  <div>
                    <Label className="text-muted-foreground">Price Covered</Label>
                    <p className="font-medium text-blue-600">
                      ${calculateAdvanceCoverage()} / ${patientData.price}
                    </p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Remaining Balance</Label>
                    <p className={`font-medium ${calculateRemainingBalance() === 0 ? 'text-green-600' : 'text-amber-600'}`}>
                      ${calculateRemainingBalance()}
                    </p>
                  </div>
                </div>

                {/* Excess Advance Warning */}
                {calculateExcessAdvance() > 0 && (
                  <div className="bg-amber-50 border border-amber-200 rounded-md p-2 mt-2">
                    <p className="text-xs text-amber-800">
                      <strong>Note:</strong> Patient has ${calculateExcessAdvance()} excess advance 
                      beyond the total price.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Payment Summary */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-md">Payment Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Current Outstanding Balance:</span>
                  <span className="font-medium">${calculateRemainingBalance()}</span>
                </div>
                {amount > 0 && (
                  <>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Payment to Add:</span>
                      <span className="font-medium text-green-600">+${amount}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">New Advance Balance:</span>
                      <span className="font-medium text-green-600">
                        ${calculateNewAdvance()}
                      </span>
                    </div>
                    <div className="flex justify-between border-t pt-2">
                      <span className="text-sm font-medium">New Outstanding Balance:</span>
                      <span className={`font-bold ${calculateNewBalance() === 0 ? 'text-green-600' : ''}`}>
                        ${calculateNewBalance()}
                      </span>
                    </div>
                    
                    {/* Payment Completion Status */}
                    {willPaymentBeComplete() && (
                      <div className="flex justify-between bg-green-50 p-2 rounded-md mt-2">
                        <span className="text-sm font-medium text-green-800">Payment Status:</span>
                        <span className="text-sm font-bold text-green-600">
                          {calculateNewBalance() === 0 ? 'FULLY PAID ✅' : 'OVERPAID ⚠️'}
                        </span>
                      </div>
                    )}
                    
                    {/* Excess Advance After Payment */}
                    {calculateNewAdvance() > patientData.price && (
                      <div className="bg-blue-50 p-2 rounded-md mt-1">
                        <div className="flex justify-between text-sm">
                          <span className="text-blue-800">Excess Advance:</span>
                          <span className="font-medium text-blue-600">
                            +${calculateNewAdvance() - patientData.price}
                          </span>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>

            {/* Payment Form */}
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-3">
                <Label htmlFor="amount" className="text-sm font-medium">
                  Payment Amount to Add *
                </Label>
                <div className="flex gap-2">
                  <Input
                    id="amount"
                    type="number"
                    min="0"
                    step="0.01"
                    disabled={processing || isPaymentComplete()}
                    placeholder={isPaymentComplete() ? "Payment completed" : "Enter payment amount"}
                    value={inputValue}
                    onChange={handleInputChange}
                    onBlur={(e) => {
                      // Ensure we have a valid number on blur
                      const value = e.target.value;
                      if (value === '') {
                        setValue('amount', 0);
                        setInputValue('');
                      }
                    }}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleFullPayment}
                    disabled={processing || isPaymentComplete() || calculateRemainingBalance() <= 0}
                  >
                    Pay Full Balance
                  </Button>
                </div>
                {errors.amount && (
                  <p className="text-sm text-red-500">{errors.amount.message}</p>
                )}
                {isPaymentComplete() && (
                  <p className="text-sm text-green-600 font-medium">
                    ✅ Patient has already completed all payments!
                  </p>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleClose}
                  disabled={processing}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={
                    processing || 
                    amount <= 0 || 
                    isPaymentComplete()
                  }
                >
                  {processing ? 'Processing...' : 'Add Payment'}
                </Button>
              </div>
            </form>

            {/* Info Note */}
            {/* <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-sm text-blue-800">
                <strong>Advance Payment System:</strong> Payments are added to the patient's advance balance. 
                When the advance equals or exceeds the total price, the patient has completed all payments. 
                Excess advance can be refunded or applied to future services.
              </p>
            </div> */}
          </>
        )}
      </div>
    </Modal>
  );
};