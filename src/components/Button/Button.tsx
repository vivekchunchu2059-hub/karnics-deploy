import { Button } from '@mui/material';
import { styled } from '@mui/material/styles';

// For future use
// const AddProductButton = (props: ButtonProps): React.JSX.Element => {
//   return <Button className="add-product-button" {...props} />;
// };

const AddProductButton = styled(Button)(() => (
    {
    backgroundColor: '#6b1010',
    color: '#ffffff',
    textTransform: 'none',
    fontSize: '14px',
    fontWeight: 500,
    padding: '8px 20px',
    borderRadius: '6px',
    height: '40px',
    '&:hover': {
      backgroundColor: '#8b1515',
    },
  }
));

export default AddProductButton;
